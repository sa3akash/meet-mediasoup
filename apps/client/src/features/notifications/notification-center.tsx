"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, X, Sparkles } from "lucide-react";
import { NotificationCard, type NotificationItem } from "./components/notification-card";

interface NotificationCenterProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onFetchNotifications: () => Promise<any>;
  onMarkRead: (id: string) => Promise<any>;
  remoteNotification?: NotificationItem | null;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onFetchNotifications,
  onMarkRead,
  remoteNotification,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onFetchNotifications()
      .then((res) => {
        if (res?.notifications && Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
        }
      })
      .catch(() => {});
  }, [onFetchNotifications]);

  const [prevRemoteId, setPrevRemoteId] = useState<string | null>(null);
  if (remoteNotification && remoteNotification.id !== prevRemoteId) {
    setPrevRemoteId(remoteNotification.id);
    setNotifications((prev) => [remoteNotification, ...prev]);
  }

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    await onMarkRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      if (!n.isRead) {
        await onMarkRead(n.id);
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={containerRef}
      className="fixed top-16 right-4 z-50 w-96 max-h-[80vh] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">Reminders, invites, & alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
            <Sparkles className="w-8 h-8 text-slate-600" />
            <span>You&apos;re all caught up! No notifications.</span>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkRead={handleMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
};
