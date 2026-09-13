"use client";

import { RefObject } from "react";
import { Mic, MicOff, Video, VideoOff, ShieldCheck, KeyRound, Mail } from "lucide-react";

interface LobbyPreviewCardProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  name: string;
  isVideoMuted: boolean;
  isAudioMuted: boolean;
  toggleAudio: () => void;
  toggleVideo: () => void;
  accessLevel: string;
}

export function LobbyPreviewCard({
  videoRef,
  name,
  isVideoMuted,
  isAudioMuted,
  toggleAudio,
  toggleVideo,
  accessLevel,
}: LobbyPreviewCardProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover scale-x-[-1] ${isVideoMuted ? "hidden" : ""}`}
        />

        {isVideoMuted && (
          <div className="w-24 h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white/50 font-bold text-3xl shadow-inner">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        )}

        {/* In-Preview Controls */}
        <div className="absolute bottom-4 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAudio}
            className={`p-3 rounded-full backdrop-blur-md transition-all ${
              isAudioMuted
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-black/50 hover:bg-black/70 text-white border border-white/20"
            }`}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3 rounded-full backdrop-blur-md transition-all ${
              isVideoMuted
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-black/50 hover:bg-black/70 text-white border border-white/20"
            }`}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-neutral-400 text-xs mt-3">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SFU Encrypted</span>
        </span>
        {accessLevel === "PRIVATE" && (
          <span className="flex items-center gap-1 text-amber-400">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Passcode Protected</span>
          </span>
        )}
        {accessLevel === "INVITE_ONLY" && (
          <span className="flex items-center gap-1 text-blue-400">
            <Mail className="w-3.5 h-3.5" />
            <span>Invite Only</span>
          </span>
        )}
      </div>
    </div>
  );
}
