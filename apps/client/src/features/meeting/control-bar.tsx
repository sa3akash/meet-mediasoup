"use client";

import { useState } from "react";
import { PhoneOff, Lock, MoreHorizontal, MessageSquare } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { MediaButtons } from "./controls/media-buttons";
import { ReactionsPicker } from "./controls/reactions-picker";
import { ControlBarActions } from "./components/control-bar-actions";
import { MoreActionsMenu } from "./components/more-actions-menu";

interface ControlBarProps {
  onLeave: () => void;
  onSendReaction?: (emoji: string) => void;
  onOpenHostControls?: () => void;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onOpenScreenShareModal?: () => void;
  onOpenRecordingModal?: () => void;
  onOpenLiveStreamingModal?: () => void;
  onOpenWhiteboardModal?: () => void;
  onOpenFileSharePanel?: () => void;
  onOpenNotificationCenter?: () => void;
  onToggleHandRaise?: () => void;
  disableScreenShare?: boolean;
  disableReactions?: boolean;
  disableChat?: boolean;
  isLocked?: boolean;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export function ControlBar({
  onLeave,
  onSendReaction,
  onOpenHostControls,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onOpenScreenShareModal,
  onOpenRecordingModal,
  onOpenLiveStreamingModal,
  onOpenWhiteboardModal,
  onOpenFileSharePanel,
  onOpenNotificationCenter,
  onToggleHandRaise,
  disableScreenShare,
  disableReactions,
  isLocked,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}: ControlBarProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const {
    isChatOpen, toggleChat, isParticipantsListOpen, toggleParticipantsList,
    isActivitiesOpen, toggleActivities, participants, slug, isHost, isRecording, isLiveStreaming,
  } = useMeetingStore();

  return (
    <div className="relative w-full bg-neutral-900/95 backdrop-blur-xl border-t border-white/10 z-20">
      {/* Mobile bar (< md) */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 h-16 w-full">
        <MediaButtons
          disableScreenShare={disableScreenShare}
          onToggleAudio={onToggleAudio}
          onToggleVideo={onToggleVideo}
          onToggleScreenShare={onToggleScreenShare || onOpenScreenShareModal}
          onToggleHandRaise={onToggleHandRaise}
        />
        {!disableReactions && <ReactionsPicker onSelectEmoji={onSendReaction} />}
        <button
          onClick={toggleChat}
          className={`p-3 rounded-full transition-colors relative ${
            isChatOpen ? "bg-indigo-600 text-white" : "bg-neutral-800 text-white/80 border border-white/10"
          }`}
          title="Meeting chat"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setIsMoreOpen(true)}
          className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white/80 border border-white/10 transition-colors relative"
          title="More options"
        >
          <MoreHorizontal className="w-5 h-5" />
          {(unreadNotificationsCount > 0 || isRecording || isLiveStreaming) && (
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          )}
        </button>
        <button
          onClick={onLeave}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-md active:scale-95"
          title="Leave call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop bar (>= md) */}
      <div className="hidden md:flex items-center justify-between px-6 h-20 w-full">
        <div className="flex items-center gap-3">
          <span className="text-white/80 font-medium text-sm tracking-wide">{slug || "meet-room"}</span>
          {isLocked && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="text-white/40 text-xs">Encrypted (SFU)</span>
        </div>

        <div className="flex items-center gap-3">
          <MediaButtons
            disableScreenShare={disableScreenShare}
            onToggleAudio={onToggleAudio}
            onToggleVideo={onToggleVideo}
            onToggleScreenShare={onOpenScreenShareModal || onToggleScreenShare}
            onToggleHandRaise={onToggleHandRaise}
          />
          {!disableReactions && <ReactionsPicker onSelectEmoji={onSendReaction} />}
          <button
            onClick={onLeave}
            className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg flex items-center gap-2 font-medium active:scale-95"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Leave</span>
          </button>
        </div>

        <ControlBarActions
          isHost={isHost} isRecording={isRecording} isChatOpen={isChatOpen}
          isParticipantsListOpen={isParticipantsListOpen} isActivitiesOpen={isActivitiesOpen}
          participantsCount={participants.size + 1} unreadMessagesCount={unreadMessagesCount}
          unreadNotificationsCount={unreadNotificationsCount} onOpenRecordingModal={onOpenRecordingModal}
          onOpenLiveStreamingModal={onOpenLiveStreamingModal} onOpenWhiteboardModal={onOpenWhiteboardModal}
          onOpenFileSharePanel={onOpenFileSharePanel} onOpenNotificationCenter={onOpenNotificationCenter}
          onOpenHostControls={onOpenHostControls} toggleParticipantsList={toggleParticipantsList}
          toggleChat={toggleChat} toggleActivities={toggleActivities}
        />
      </div>

      <MoreActionsMenu
        isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} isHost={isHost}
        isRecording={isRecording} isLiveStreaming={isLiveStreaming} isLocked={isLocked} slug={slug || undefined}
        participantsCount={participants.size + 1} unreadNotificationsCount={unreadNotificationsCount}
        disableScreenShare={disableScreenShare} onOpenParticipants={toggleParticipantsList}
        onOpenActivities={toggleActivities} onOpenWhiteboard={onOpenWhiteboardModal}
        onOpenFileShare={onOpenFileSharePanel} onOpenNotifications={onOpenNotificationCenter}
        onOpenScreenShare={onOpenScreenShareModal || onToggleScreenShare} onOpenRecording={onOpenRecordingModal}
        onOpenLiveStreaming={onOpenLiveStreamingModal} onOpenHostControls={onOpenHostControls}
      />
    </div>
  );
}
