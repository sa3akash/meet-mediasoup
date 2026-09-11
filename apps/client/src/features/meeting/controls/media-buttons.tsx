"use client";

import { Mic, MicOff, Video, VideoOff, ScreenShare, Hand } from "lucide-react";
import { useMediaStore } from "../../../stores/media-store";
import { useMeetingStore } from "../../../stores/meeting-store";

export function MediaButtons() {
  const { isAudioMuted, isVideoMuted, isScreenSharing, toggleAudio, toggleVideo, setScreenSharing } = useMediaStore();
  const { isHandRaised, setHandRaised } = useMeetingStore();

  const handleScreenShare = async () => {
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

  return (
    <>
      <button
        onClick={toggleAudio}
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
        onClick={toggleVideo}
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
        className={`p-3.5 rounded-full transition-all duration-200 shadow-md ${
          isScreenSharing ? "bg-blue-600 text-white" : "bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10"
        }`}
        title="Share screen"
      >
        <ScreenShare className="w-5 h-5" />
      </button>

      <button
        onClick={() => setHandRaised(!isHandRaised)}
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
