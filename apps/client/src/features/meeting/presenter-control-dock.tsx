"use client";

import { useState } from "react";
import { ScreenShare, ScreenShareOff, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useMediaStore } from "../../stores/media-store";

interface PresenterControlDockProps {
  onStopShare: () => void;
  onPauseShare?: (paused: boolean) => void;
  onToggleAudio?: (muted: boolean) => void;
}

export function PresenterControlDock({
  onStopShare,
  onPauseShare,
  onToggleAudio,
}: PresenterControlDockProps) {
  const { isScreenSharing, screenStream } = useMediaStore();
  const [isPaused, setIsPaused] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  if (!isScreenSharing || !screenStream) return null;

  const hasAudioTrack = screenStream.getAudioTracks().length > 0;

  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    onPauseShare?.(nextPaused);
  };

  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    onToggleAudio?.(nextMuted);
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border border-blue-500/30 rounded-full px-4 py-2 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-top-4">
      {/* Presenting Indicator */}
      <div className="flex items-center gap-2 pl-1 pr-2 border-r border-white/10">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
        </span>
        <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
          <ScreenShare className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">You are presenting</span>
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {/* Pause/Resume Video Track */}
        <button
          onClick={handleTogglePause}
          className={`p-2 rounded-full transition-colors text-xs font-medium flex items-center gap-1.5 ${
            isPaused
              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title={isPaused ? "Resume screen sharing" : "Pause screen sharing"}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="text-[11px] hidden md:inline">{isPaused ? "Resume" : "Pause"}</span>
        </button>

        {/* System Audio Track Mute/Unmute */}
        {hasAudioTrack && (
          <button
            onClick={handleToggleAudio}
            className={`p-2 rounded-full transition-colors text-xs font-medium flex items-center gap-1.5 ${
              isAudioMuted
                ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title={isAudioMuted ? "Unmute system audio" : "Mute system audio"}
          >
            {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden md:inline">{isAudioMuted ? "Audio Off" : "Audio On"}</span>
          </button>
        )}

        {/* Stop Presenting */}
        <button
          onClick={onStopShare}
          className="ml-1 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          title="Stop presenting your screen"
        >
          <ScreenShareOff className="w-3.5 h-3.5" />
          <span>Stop sharing</span>
        </button>
      </div>
    </div>
  );
}
