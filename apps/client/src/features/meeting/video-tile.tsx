"use client";

import { useEffect, useRef } from "react";
import { MicOff, Hand, Pin } from "lucide-react";

interface VideoTileProps {
  displayName: string;
  avatarUrl?: string | null;
  stream?: MediaStream | null;
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
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center transition-all duration-300 shadow-lg ${
        isActiveSpeaker ? "ring-2 ring-emerald-500 shadow-emerald-500/20" : "ring-1 ring-white/10"
      }`}
    >
      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${!hasVideo ? "hidden" : ""} ${isLocal ? "scale-x-[-1]" : ""}`}
      />

      {/* Avatar Fallback */}
      {!hasVideo && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      )}

      {/* Badges & Overlays */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
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

      {/* Participant Name Badge */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-xs font-medium border border-white/10">
        <span>{displayName} {isLocal && "(You)"}</span>
      </div>
    </div>
  );
}
