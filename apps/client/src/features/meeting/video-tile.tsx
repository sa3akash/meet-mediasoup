"use client";

import { useEffect, useRef } from "react";
import { MicOff, Hand, Pin } from "lucide-react";

interface VideoTileProps {
  displayName: string;
  avatarUrl?: string | null;
  stream?: MediaStream | null;
  isVideoMuted?: boolean;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
  isHandRaised?: boolean;
  isPinned?: boolean;
  isLocal?: boolean;
  onPinToggle?: () => void;
}

export function VideoTile({
  displayName,
  avatarUrl,
  stream,
  isVideoMuted = false,
  isMuted = false,
  isActiveSpeaker = false,
  isHandRaised = false,
  isPinned = false,
  isLocal = false,
  onPinToggle,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const hasTrack = !!(stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
  const showVideo = !isVideoMuted && hasTrack;
  const isSpeaking = isActiveSpeaker && !isMuted;

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center transition-all duration-300 shadow-lg ${
        isSpeaking
          ? "ring-3 ring-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
          : "ring-1 ring-white/10"
      }`}
    >
      {/* Top Left: Speaking Badge */}
      {isSpeaking && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/50 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-semibold text-emerald-300">Speaking</span>
        </div>
      )}

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className={`w-full h-full object-cover ${!showVideo ? "hidden" : ""} ${isLocal ? "scale-x-[-1]" : ""}`}
      />

      {/* Avatar Fallback with Google Meet Speaking Ripple Waves */}
      {!showVideo && (
        <div className="relative flex flex-col items-center gap-3">
          {/* Animated Acoustic Ripple Rings when speaking */}
          {isSpeaking && (
            <>
              <div className="absolute -inset-6 rounded-full border-2 border-emerald-400/30 animate-ripple-1 pointer-events-none" />
              <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/60 animate-ripple-2 pointer-events-none" />
            </>
          )}

          <div
            className={`relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl transition-all duration-300 ${
              isSpeaking ? "ring-4 ring-emerald-400 shadow-emerald-400/40 scale-105" : ""
            }`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      )}

      {/* Badges & Overlays */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {isHandRaised && (
          <div className="bg-amber-500 text-black p-1.5 rounded-full shadow-md animate-bounce">
            <Hand className="w-4 h-4" />
          </div>
        )}
        {isMuted && (
          <div className="bg-red-500/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-md">
            <MicOff className="w-4 h-4" />
          </div>
        )}
        {onPinToggle && (
          <button
            onClick={onPinToggle}
            className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
              isPinned ? "bg-white text-black" : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Participant Name Badge + Sound Wave Equalizer */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-xs font-medium border border-white/10">
        <span>{displayName} {isLocal && "(You)"}</span>

        {/* Google Meet 3-Bar Equalizer Wave */}
        {isSpeaking && (
          <div className="flex items-center gap-0.5 h-3.5 px-1 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40">
            <span className="w-0.5 bg-emerald-400 rounded-full animate-soundwave-1" />
            <span className="w-0.5 bg-emerald-400 rounded-full animate-soundwave-2" />
            <span className="w-0.5 bg-emerald-400 rounded-full animate-soundwave-3" />
          </div>
        )}
      </div>
    </div>
  );
}
