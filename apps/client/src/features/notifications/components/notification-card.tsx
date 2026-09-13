"use client";

import {
  Calendar,
  UserCheck,
  UserX,
  Film,
  MessageSquare,
  Clock,
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

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}

export function NotificationCard({ notification: n, onMarkRead }: NotificationCardProps) {
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
      onClick={() => onMarkRead(n.id)}
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
  );
}
