export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  channels: string[];
  isRead: boolean;
  createdAt: string;
}

const notificationMemory = new Map<string, NotificationItem[]>();
const pushSubscriptions = new Map<string, Set<any>>();

export class NotificationStore {
  public getMemoryNotifications(userId: string): NotificationItem[] {
    return notificationMemory.get(userId) || [];
  }

  public addMemoryNotification(userId: string, item: NotificationItem): void {
    let list = notificationMemory.get(userId);
    if (!list) {
      list = [];
      notificationMemory.set(userId, list);
    }
    list.unshift(item);
  }

  public setMemoryNotifications(userId: string, list: NotificationItem[]): void {
    notificationMemory.set(userId, list);
  }

  public clearMemoryNotifications(userId: string): void {
    notificationMemory.delete(userId);
  }

  public registerPushSub(userId: string, subscription: any): void {
    let subs = pushSubscriptions.get(userId);
    if (!subs) {
      subs = new Set();
      pushSubscriptions.set(userId, subs);
    }
    subs.add(subscription);
  }

  public getPushSubs(userId: string): Set<any> | undefined {
    return pushSubscriptions.get(userId);
  }
}

export const notificationStore = new NotificationStore();
