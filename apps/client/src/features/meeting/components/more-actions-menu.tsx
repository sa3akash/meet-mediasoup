"use client";

import React from "react";
import {
  Users,
  Shapes,
  Pencil,
  UploadCloud,
  Bell,
  ScreenShare,
  Radio,
  Tv,
  ShieldAlert,
  X,
  Lock,
} from "lucide-react";

interface MoreActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  isRecording: boolean;
  isLiveStreaming?: boolean;
  isLocked?: boolean;
  slug?: string;
  participantsCount: number;
  unreadNotificationsCount: number;
  disableScreenShare?: boolean;
  onOpenParticipants: () => void;
  onOpenActivities: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFileShare?: () => void;
  onOpenNotifications?: () => void;
  onOpenScreenShare?: () => void;
  onOpenRecording?: () => void;
  onOpenLiveStreaming?: () => void;
  onOpenHostControls?: () => void;
}

export function MoreActionsMenu({
  isOpen,
  onClose,
  isHost,
  isRecording,
  isLiveStreaming,
  isLocked,
  slug,
  participantsCount,
  unreadNotificationsCount,
  disableScreenShare,
  onOpenParticipants,
  onOpenActivities,
  onOpenWhiteboard,
  onOpenFileShare,
  onOpenNotifications,
  onOpenScreenShare,
  onOpenRecording,
  onOpenLiveStreaming,
  onOpenHostControls,
}: MoreActionsMenuProps) {
  if (!isOpen) return null;

  const handleAction = (action?: () => void) => {
    if (action) action();
    onClose();
  };

  const actionItems = [
    { id: "participants", label: "People", icon: Users, badge: participantsCount, color: "text-indigo-400 bg-indigo-500/10", action: onOpenParticipants },
    { id: "activities", label: "Activities", icon: Shapes, color: "text-emerald-400 bg-emerald-500/10", action: onOpenActivities },
    onOpenWhiteboard && { id: "whiteboard", label: "Whiteboard", icon: Pencil, color: "text-amber-400 bg-amber-500/10", action: onOpenWhiteboard },
    onOpenFileShare && { id: "files", label: "Files", icon: UploadCloud, color: "text-blue-400 bg-blue-500/10", action: onOpenFileShare },
    onOpenNotifications && { id: "notifications", label: "Alerts", icon: Bell, badge: unreadNotificationsCount || undefined, color: "text-purple-400 bg-purple-500/10", action: onOpenNotifications },
    onOpenScreenShare && !disableScreenShare && { id: "screenshare", label: "Share Screen", icon: ScreenShare, color: "text-cyan-400 bg-cyan-500/10", action: onOpenScreenShare },
    onOpenRecording && { id: "recording", label: isRecording ? "Recording" : "Record", icon: Radio, badge: isRecording ? "REC" : undefined, badgeColor: "bg-red-600 text-white animate-pulse", color: isRecording ? "text-red-400 bg-red-500/20" : "text-rose-400 bg-rose-500/10", action: onOpenRecording },
    onOpenLiveStreaming && { id: "streaming", label: isLiveStreaming ? "Live" : "Stream", icon: Tv, badge: isLiveStreaming ? "LIVE" : undefined, badgeColor: "bg-red-600 text-white animate-pulse", color: isLiveStreaming ? "text-red-400 bg-red-500/20" : "text-violet-400 bg-violet-500/10", action: onOpenLiveStreaming },
    isHost && onOpenHostControls && { id: "host", label: "Host Controls", icon: ShieldAlert, color: "text-amber-400 bg-amber-500/10", action: onOpenHostControls },
  ].filter(Boolean) as Array<{ id: string; label: string; icon: any; badge?: any; badgeColor?: string; color: string; action?: () => void }>;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-neutral-900 border border-white/10 text-white shadow-2xl rounded-t-3xl sm:rounded-3xl p-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">More Options</h3>
            <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <span>{slug || "Meeting"}</span>
              {isLocked && (
                <span className="text-amber-400 flex items-center gap-0.5 text-[10px]">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleAction(item.action)}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 border border-white/5 hover:border-white/10 transition-all text-center group active:scale-95 relative"
              >
                <div className={`p-2.5 rounded-xl ${item.color} group-hover:scale-110 transition-transform relative`}>
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && (
                    <span className={`absolute -top-1 -right-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold shadow-md ${item.badgeColor || "bg-indigo-600 text-white"}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-neutral-200 line-clamp-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
