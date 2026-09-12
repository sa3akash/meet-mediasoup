"use client";

import { Mic, MicOff, Video, VideoOff, ScreenShare, Hand } from "lucide-react";
import { useMediaStore } from "../../../stores/media-store";
import { useMeetingStore } from "../../../stores/meeting-store";

interface MediaButtonsProps {
  disableScreenShare?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onToggleHandRaise?: () => void;
}

export function MediaButtons({
  disableScreenShare,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
}: MediaButtonsProps) {
  const { isAudioMuted, isVideoMuted, isScreenSharing, toggleAudio, toggleVideo, setScreenSharing } = useMediaStore();
  const { isHandRaised, setHandRaised } = useMeetingStore();

  const handleScreenShare = async () => {
    if (disableScreenShare) return;
    if (onToggleScreenShare) {
      onToggleScreenShare();
      return;
    }
    try {
      if (isScreenSharing) {
        setScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => setScreenSharing(false);
      }
    } catch (e) {
      console.warn("Screen share cancelled:", e);
    }
  };

  const handleAudio = () => {
    if (onToggleAudio) onToggleAudio();
    else toggleAudio();
  };

  const handleVideo = () => {
    if (onToggleVideo) onToggleVideo();
    else toggleVideo();
  };

  const handleHandRaise = () => {
    if (onToggleHandRaise) onToggleHandRaise();
    else setHandRaised(!isHandRaised);
  };

  return (
    <>
      <button
        onClick={handleAudio}
        className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
          isAudioMuted
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
        }`}
        title={isAudioMuted ? "Turn on microphone" : "Turn off microphone"}
      >
        {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <button
        onClick={handleVideo}
        className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
          isVideoMuted
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
        }`}
        title={isVideoMuted ? "Turn on camera" : "Turn off camera"}
      >
        {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </button>

      <button
        onClick={handleScreenShare}
        disabled={disableScreenShare}
        className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
          disableScreenShare
            ? "bg-neutral-800/40 text-neutral-600 cursor-not-allowed border border-white/5"
            : isScreenSharing
            ? "bg-blue-600 text-white"
            : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
        }`}
        title={disableScreenShare ? "Screen sharing disabled by host" : "Share screen"}
      >
        <ScreenShare className="w-5 h-5" />
      </button>

      <button
        onClick={handleHandRaise}
        className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
          isHandRaised ? "bg-amber-500 text-black font-semibold" : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
        }`}
        title="Raise or lower hand"
      >
        <Hand className="w-5 h-5" />
      </button>
    </>
  );
}
