"use client";

import { PhoneOff, Lock } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { MediaButtons } from "./controls/media-buttons";
import { ReactionsPicker } from "./controls/reactions-picker";
import { ControlBarActions } from "./components/control-bar-actions";

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
  disableChat: _disableChat,
  isLocked,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}: ControlBarProps) {
  const {
    isChatOpen,
    toggleChat,
    isParticipantsListOpen,
    toggleParticipantsList,
    isActivitiesOpen,
    toggleActivities,
    participants,
    slug,
    isHost,
    isRecording,
  } = useMeetingStore();

  return (
    <div className="relative w-full h-20 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-20">
      {/* Left: Meeting code / encryption badge */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-white/80 font-medium text-sm tracking-wide">{slug || "meet-room"}</span>
        {isLocked && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold flex items-center gap-1">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        <span className="text-white/40 text-xs">Encrypted (SFU)</span>
      </div>

      {/* Center: Main Call Controls */}
      <div className="flex items-center gap-3">
        <MediaButtons
          disableScreenShare={disableScreenShare}
          onToggleAudio={onToggleAudio}
          onToggleVideo={onToggleVideo}
          onToggleScreenShare={onOpenScreenShareModal || onToggleScreenShare}
          onToggleHandRaise={onToggleHandRaise}
        />
        {!disableReactions && <ReactionsPicker onSelectEmoji={onSendReaction} />}

        {/* End Call */}
        <button
          onClick={onLeave}
          className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg flex items-center gap-2 font-medium active:scale-95"
          title="Leave call"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden md:inline">Leave</span>
        </button>
      </div>

      {/* Right: Sidebars & Tool Toggles */}
      <ControlBarActions
        isHost={isHost}
        isRecording={isRecording}
        isChatOpen={isChatOpen}
        isParticipantsListOpen={isParticipantsListOpen}
        isActivitiesOpen={isActivitiesOpen}
        participantsCount={participants.size + 1}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenRecordingModal={onOpenRecordingModal}
        onOpenLiveStreamingModal={onOpenLiveStreamingModal}
        onOpenWhiteboardModal={onOpenWhiteboardModal}
        onOpenFileSharePanel={onOpenFileSharePanel}
        onOpenNotificationCenter={onOpenNotificationCenter}
        onOpenHostControls={onOpenHostControls}
        toggleParticipantsList={toggleParticipantsList}
        toggleChat={toggleChat}
        toggleActivities={toggleActivities}
      />
    </div>
  );
}
