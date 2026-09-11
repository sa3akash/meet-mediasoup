"use client";

import { useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  Smile,
  MessageSquare,
  Users,
  PhoneOff,
  MoreVertical,
  LayoutGrid,
} from "lucide-react";
import { useMediaStore } from "../../stores/media-store";
import { useMeetingStore } from "../../stores/meeting-store";

interface ControlBarProps {
  onLeave: () => void;
  onSendReaction?: (emoji: string) => void;
}

export function ControlBar({ onLeave, onSendReaction }: ControlBarProps) {
  const { isAudioMuted, isVideoMuted, isScreenSharing, toggleAudio, toggleVideo, setScreenSharing } = useMediaStore();
  const {
    isHandRaised,
    setHandRaised,
    isChatOpen,
    toggleChat,
    isParticipantsListOpen,
    toggleParticipantsList,
    participants,
    slug,
  } = useMeetingStore();

  const [showReactions, setShowReactions] = useState(false);
  const emojis = ["❤️", "👍", "🎉", "👏", "😂", "😮"];

  const handleScreenShareToggle = async () => {
    try {
      if (isScreenSharing) {
        setScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => setScreenSharing(false);
      }
    } catch (e) {
      console.warn("Screen share cancelled or failed:", e);
    }
  };

  return (
    <div className="relative w-full h-20 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 px-6 flex items-center justify-between z-20">
      {/* Left: Meeting code / time */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-white/80 font-medium text-sm tracking-wide">{slug || "meet-room"}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
        <span className="text-white/40 text-xs">Encrypted (SFU)</span>
      </div>

      {/* Center: Main Call Controls */}
      <div className="flex items-center gap-3">
        {/* Audio Mute */}
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
            isAudioMuted
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
          }`}
          title={isAudioMuted ? "Turn on microphone (Ctrl+D)" : "Turn off microphone (Ctrl+D)"}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Mute */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
            isVideoMuted
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
          }`}
          title={isVideoMuted ? "Turn on camera (Ctrl+E)" : "Turn off camera (Ctrl+E)"}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={handleScreenShareToggle}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
            isScreenSharing
              ? "bg-blue-600 text-white"
              : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
          }`}
          title="Share screen"
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* Raise Hand */}
        <button
          onClick={() => setHandRaised(!isHandRaised)}
          className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
            isHandRaised
              ? "bg-amber-500 text-black font-semibold"
              : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
          }`}
          title="Raise or lower hand"
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Reactions */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 transition-all duration-200 shadow-md"
            title="Send reaction"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showReactions && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-neutral-800/95 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl animate-in fade-in zoom-in-90">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction?.(emoji);
                    setShowReactions(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* End Call */}
        <button
          onClick={onLeave}
          className="px-5 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg flex items-center gap-2 font-medium"
          title="Leave call"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden md:inline">Leave</span>
        </button>
      </div>

      {/* Right: Sidebars & Toggles */}
      <div className="flex items-center gap-2">
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
        </button>
      </div>
    </div>
  );
}
