"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Settings, ShieldCheck } from "lucide-react";
import { useMediaStore } from "../../stores/media-store";

interface PreJoinLobbyProps {
  meetingTitle: string;
  onJoin: (displayName: string) => void;
}

export function PreJoinLobby({ meetingTitle, onJoin }: PreJoinLobbyProps) {
  const [name, setName] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { localStream, setLocalStream, isAudioMuted, isVideoMuted, toggleAudio, toggleVideo } = useMediaStore();

  useEffect(() => {
    // Acquire user media preview
    async function getPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.warn("Camera or microphone permission denied or unavailable:", e);
      }
    }
    getPreview();
  }, [setLocalStream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(name.trim());
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Column: Camera Preview Box */}
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
          <span className="text-white/40 text-xs mt-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> End-to-end encrypted room
          </span>
        </div>

        {/* Right Column: Join Form */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-white text-3xl font-bold tracking-tight">{meetingTitle}</h1>
            <p className="text-white/60 text-sm mt-1">Ready to join? Check your audio and video before entering.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Your Name
              </label>
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base"
              />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 py-3.5 px-6 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
              >
                Join now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
