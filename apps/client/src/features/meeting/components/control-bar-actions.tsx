"use client";

import {
  Radio,
  Tv,
  Pencil,
  UploadCloud,
  Bell,
  ShieldAlert,
  Users,
  MessageSquare,
  Shapes,
} from "lucide-react";
import { LayoutSwitcher } from "../layout-switcher";

interface ControlBarActionsProps {
  isHost: boolean;
  isRecording: boolean;
  isChatOpen: boolean;
  isParticipantsListOpen: boolean;
  isActivitiesOpen: boolean;
  participantsCount: number;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onOpenRecordingModal?: () => void;
  onOpenLiveStreamingModal?: () => void;
  onOpenWhiteboardModal?: () => void;
  onOpenFileSharePanel?: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenHostControls?: () => void;
  toggleParticipantsList: () => void;
  toggleChat: () => void;
  toggleActivities: () => void;
}

export function ControlBarActions({
  isHost,
  isRecording,
  isChatOpen,
  isParticipantsListOpen,
  isActivitiesOpen,
  participantsCount,
  unreadMessagesCount,
  unreadNotificationsCount,
  onOpenRecordingModal,
  onOpenLiveStreamingModal,
  onOpenWhiteboardModal,
  onOpenFileSharePanel,
  onOpenNotificationCenter,
  onOpenHostControls,
  toggleParticipantsList,
  toggleChat,
  toggleActivities,
}: ControlBarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <LayoutSwitcher />

      {onOpenRecordingModal && (
        <button
          onClick={onOpenRecordingModal}
          className={`p-3 rounded-xl transition-all relative flex items-center gap-1.5 ${
            isRecording
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title={isRecording ? "Recording in progress" : "Record meeting"}
        >
          <Radio className="w-5 h-5" />
          {isRecording && <span className="text-xs font-mono font-bold">REC</span>}
        </button>
      )}

      {onOpenLiveStreamingModal && (
        <button
          onClick={onOpenLiveStreamingModal}
          className="p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
          title="Live Streaming (YouTube, Facebook, RTMP)"
        >
          <Tv className="w-5 h-5" />
        </button>
      )}

      {onOpenWhiteboardModal && (
        <button
          onClick={onOpenWhiteboardModal}
          className="p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Collaborative Whiteboard"
        >
          <Pencil className="w-5 h-5 text-amber-400" />
        </button>
      )}

      {onOpenFileSharePanel && (
        <button
          onClick={onOpenFileSharePanel}
          className="p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Shared Files & Documents"
        >
          <UploadCloud className="w-5 h-5 text-blue-400" />
        </button>
      )}

      {onOpenNotificationCenter && (
        <button
          onClick={onOpenNotificationCenter}
          className="p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-indigo-400" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </button>
      )}

      {Boolean(isHost && onOpenHostControls) && (
        <button
          onClick={onOpenHostControls}
          className="p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Host Controls"
        >
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
        </button>
      )}

      <button
        onClick={toggleParticipantsList}
        className={`p-3 rounded-xl transition-colors relative ${
          isParticipantsListOpen ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
        }`}
        title="Participants"
      >
        <Users className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {participantsCount}
        </span>
      </button>

      <button
        onClick={toggleChat}
        className={`p-3 rounded-xl transition-colors relative ${
          isChatOpen ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
        }`}
        title="Meeting chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadMessagesCount > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg animate-bounce">
            {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
          </span>
        )}
      </button>

      <button
        onClick={toggleActivities}
        className={`p-3 rounded-xl transition-colors relative ${
          isActivitiesOpen ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
        }`}
        title="Activities (Polls & Breakout Rooms)"
      >
        <Shapes className="w-5 h-5" />
      </button>
    </div>
  );
}
