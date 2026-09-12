"use client";

import { MessageSquare, Users, PhoneOff, ShieldAlert, Lock, Shapes, Radio } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { MediaButtons } from "./controls/media-buttons";
import { ReactionsPicker } from "./controls/reactions-picker";
import { LayoutSwitcher } from "./layout-switcher";

interface ControlBarProps {
  onLeave: () => void;
  onSendReaction?: (emoji: string) => void;
  onOpenHostControls?: () => void;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onOpenScreenShareModal?: () => void;
  onOpenRecordingModal?: () => void;
  onToggleHandRaise?: () => void;
  disableScreenShare?: boolean;
  disableReactions?: boolean;
  disableChat?: boolean;
  isLocked?: boolean;
  unreadMessagesCount?: number;
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
  onToggleHandRaise,
  disableScreenShare,
  disableReactions,
  disableChat,
  isLocked,
  unreadMessagesCount = 0,
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
      {/* Left: Meeting code / time */}
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

      {/* Right: Sidebars & Toggles */}
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
            {participants.size + 1}
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
    </div>
  );
}

