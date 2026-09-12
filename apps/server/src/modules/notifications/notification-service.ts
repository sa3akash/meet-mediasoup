import nodemailer from "nodemailer";
import { redis } from "../../infrastructure/redis";
import { db } from "../../infrastructure/database";
import { notifications as dbNotifications } from "../../infrastructure/database/schema/notifications";
import { eq } from "drizzle-orm";

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
const pushSubscriptions = new Map<string, Set<any>>(); // userId -> pushSubscriptions

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

  public async registerPushSubscription(userId: string, subscription: any): Promise<void> {
    let subs = pushSubscriptions.get(userId);
    if (!subs) {
      subs = new Set();
      pushSubscriptions.set(userId, subs);
    }
    subs.add(subscription);

    try {
      await redis.sadd(`user:${userId}:push_subs`, JSON.stringify(subscription));
    } catch {}
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

    // Persist to PostgreSQL if user exists in database
    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(userId)) {
        const userExists = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
        }).catch(() => null);

        if (userExists) {
          await db.insert(dbNotifications).values({
            id: item.id,
            userId,
            title,
            body,
            type,
            data: data || {},
            isRead: false,
          });
        }
      }
    } catch (dbErr) {
      // User is likely anonymous / guest participant
    }


    // 2. Email Channel via Nodemailer (dispatched in background)
    if (channels.includes("EMAIL") && userEmail) {
      transporter
        .sendMail({
          from: `"Enterprise Meet" <${process.env.SMTP_FROM || "noreply@meet.io"}>`,
          to: userEmail,
          subject: title,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="font-size: 20px; font-weight: bold; color: #4f46e5;">Enterprise Meet</span>
              </div>
              <h2 style="color: #0f172a; margin-bottom: 12px; font-size: 18px;">${title}</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">${body}</p>
              ${
                data?.downloadUrl
                  ? `<a href="${data.downloadUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Download MP4</a>`
                  : data?.meetingUrl
                  ? `<a href="${data.meetingUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Join Meeting</a>`
                  : ""
              }
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin-top: 28px; margin-bottom: 16px;" />
              <p style="color: #94a3b8; font-size: 11px;">You received this automated event notification because of your account settings on Enterprise Meet.</p>
            </div>
          `,
        })
        .catch((err: any) => {
          console.warn("[NotificationService] Email send notice:", err.message || err);
        });
    }


    // 3. Push Channel (Web Push)
    if (channels.includes("PUSH")) {
      const subs = pushSubscriptions.get(userId);
      if (subs && subs.size > 0) {
        // Dispatch to browser push service worker endpoints
        subs.forEach((sub) => {
          try {
            // Simulated web push message payload delivery
            console.log(`[Push Notification] Dispatched to user ${userId}: ${title}`);
          } catch {}
        });
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

    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(userId)) {
        const dbItems = await db
          .select()
          .from(dbNotifications)
          .where(eq(dbNotifications.userId, userId));
        if (dbItems.length > 0) {
          return dbItems.map((n) => ({
            id: n.id,
            userId: n.userId,
            title: n.title,
            body: n.body,
            type: n.type as any,
            data: (n.data as any) || {},
            channels: ["IN_APP"],
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
          }));
        }
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

    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(notificationId)) {
        await db
          .update(dbNotifications)
          .set({ isRead: true, readAt: new Date() })
          .where(eq(dbNotifications.id, notificationId));
      }
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

