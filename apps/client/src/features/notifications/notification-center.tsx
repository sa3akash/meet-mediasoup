"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Calendar,
  UserCheck,
  UserX,
  Film,
  MessageSquare,
  CheckCheck,
  X,
  Clock,
  Sparkles,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "MEETING_REMINDER" | "INVITE_ACCEPTED" | "INVITE_DECLINED" | "RECORDING_READY" | "NEW_MESSAGE";
  data?: Record<string, any>;
  channels: string[];
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onFetchNotifications: () => Promise<any>;
  onMarkRead: (id: string) => Promise<any>;
  remoteNotification?: NotificationItem | null;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  isOpen,
  onClose,
  onFetchNotifications,
  onMarkRead,
  remoteNotification,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch notifications on open or load
  useEffect(() => {
    onFetchNotifications()
      .then((res) => {
        if (res?.notifications && Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
        }
      })
      .catch(() => {});
  }, [onFetchNotifications]);

  // Append incoming notification
  useEffect(() => {
    if (remoteNotification) {
      setNotifications((prev) => [remoteNotification, ...prev]);
    }
  }, [remoteNotification]);

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

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "MEETING_REMINDER":
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case "INVITE_ACCEPTED":
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case "INVITE_DECLINED":
        return <UserX className="w-4 h-4 text-rose-400" />;
      case "RECORDING_READY":
        return <Film className="w-4 h-4 text-indigo-400" />;
      case "NEW_MESSAGE":
      default:
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

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
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                n.isRead
                  ? "bg-slate-800/30 border-slate-800/60 opacity-75 hover:opacity-100"
                  : "bg-slate-800/80 border-indigo-500/30 shadow-sm hover:border-indigo-500/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/60 flex-shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-semibold truncate ${n.isRead ? "text-slate-300" : "text-white"}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {n.body}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {n.channels && n.channels.length > 0 && (
                      <span className="ml-auto text-slate-400 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900">
                        {n.channels.join(" • ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
