import nodemailer from "nodemailer";
import { redis } from "../../infrastructure/redis";

export type NotificationChannel = "EMAIL" | "IN_APP" | "PUSH";
export type NotificationEventType =
  | "MEETING_REMINDER"
  | "INVITE_ACCEPTED"
  | "INVITE_DECLINED"
  | "RECORDING_READY"
  | "NEW_MESSAGE";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationEventType;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  isRead: boolean;
  createdAt: string;
}

const notificationMemory = new Map<string, NotificationItem[]>(); // userId -> notifications

// Create Nodemailer test/SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
  ignoreTLS: true,
});

export class NotificationService {
  private getRedisKey(userId: string): string {
    return `user:${userId}:notifications`;
  }

  public async sendNotification(options: {
    userId: string;
    userEmail?: string;
    title: string;
    body: string;
    type: NotificationEventType;
    data?: Record<string, any>;
    channels?: NotificationChannel[];
  }): Promise<NotificationItem> {
    const { userId, userEmail, title, body, type, data } = options;
    const channels = options.channels || ["IN_APP", "EMAIL", "PUSH"];

    const item: NotificationItem = {
      id: crypto.randomUUID(),
      userId,
      title,
      body,
      type,
      data,
      channels,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    // 1. In-App Notification (Redis & memory)
    let list = notificationMemory.get(userId);
    if (!list) {
      list = [];
      notificationMemory.set(userId, list);
    }
    list.unshift(item);

    try {
      await redis.lpush(this.getRedisKey(userId), JSON.stringify(item));
      await redis.ltrim(this.getRedisKey(userId), 0, 99); // Keep latest 100
    } catch {}

    // 2. Email Channel via Nodemailer
    if (channels.includes("EMAIL") && userEmail) {
      try {
        await transporter.sendMail({
          from: `"Google Meet Clone" <${process.env.SMTP_FROM || "noreply@meet.io"}>`,
          to: userEmail,
          subject: title,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
              <h2 style="color: #4f46e5; margin-bottom: 10px;">${title}</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">${body}</p>
              ${data?.meetingUrl ? `<a href="${data.meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 15px;">Open Meeting</a>` : ""}
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 25px;" />
              <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from Google Meet Clone.</p>
            </div>
          `,
        });
      } catch (err) {
        console.warn("[NotificationService] Email send warning (expected if SMTP test daemon not running):", (err as any).message);
      }
    }

    return item;
  }

  public async listNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const items = await redis.lrange(this.getRedisKey(userId), 0, -1);
      if (items && items.length > 0) {
        return items.map((raw) => JSON.parse(raw));
      }
    } catch {}

    return notificationMemory.get(userId) || [];
  }

  public async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const list = await this.listNotifications(userId);
    const target = list.find((n) => n.id === notificationId);
    if (!target) return false;

    target.isRead = true;
    notificationMemory.set(userId, list);

    try {
      await redis.del(this.getRedisKey(userId));
      const pipeline = redis.pipeline();
      for (const n of list.slice(0, 100)) {
        pipeline.rpush(this.getRedisKey(userId), JSON.stringify(n));
      }
      await pipeline.exec();
    } catch {}

    return true;
  }

  public async clearNotifications(userId: string): Promise<boolean> {
    notificationMemory.delete(userId);
    try {
      await redis.del(this.getRedisKey(userId));
    } catch {}
    return true;
  }
}

export const notificationService = new NotificationService();
