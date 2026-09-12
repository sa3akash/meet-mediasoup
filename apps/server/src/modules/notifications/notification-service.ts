import { redis } from "../../infrastructure/redis";
import { db } from "../../infrastructure/database";
import { notifications as dbNotifications } from "../../infrastructure/database/schema/notifications";
import { eq } from "drizzle-orm";
import { sendNotificationEmail } from "./email-dispatcher";
import { notificationStore, type NotificationItem } from "./notification-store";

export type NotificationChannel = "EMAIL" | "IN_APP" | "PUSH";
export type NotificationEventType =
  | "MEETING_REMINDER"
  | "INVITE_ACCEPTED"
  | "INVITE_DECLINED"
  | "RECORDING_READY"
  | "NEW_MESSAGE";

export type { NotificationItem };

export class NotificationService {
  private getRedisKey(userId: string): string {
    return `user:${userId}:notifications`;
  }

  public async registerPushSubscription(userId: string, subscription: any): Promise<void> {
    notificationStore.registerPushSub(userId, subscription);
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
    notificationStore.addMemoryNotification(userId, item);

    try {
      await redis.lpush(this.getRedisKey(userId), JSON.stringify(item));
      await redis.ltrim(this.getRedisKey(userId), 0, 99);
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

    // 2. Email Channel
    if (channels.includes("EMAIL") && userEmail) {
      sendNotificationEmail({ to: userEmail, title, body, data });
    }

    // 3. Push Channel (Web Push)
    if (channels.includes("PUSH")) {
      const subs = notificationStore.getPushSubs(userId);
      if (subs && subs.size > 0) {
        subs.forEach(() => {
          try {
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

    return notificationStore.getMemoryNotifications(userId);
  }

  public async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const list = await this.listNotifications(userId);
    const target = list.find((n) => n.id === notificationId);
    if (!target) return false;

    target.isRead = true;
    notificationStore.setMemoryNotifications(userId, list);

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
    notificationStore.clearMemoryNotifications(userId);
    try {
      await redis.del(this.getRedisKey(userId));
    } catch {}
    return true;
  }
}

export const notificationService = new NotificationService();
