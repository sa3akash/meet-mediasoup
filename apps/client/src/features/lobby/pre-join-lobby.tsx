"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShieldCheck,
  Lock,
  KeyRound,
  Mail,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useMediaStore } from "../../stores/media-store";
import { verifyMeetingAccessAction } from "../../actions/meeting.actions";

interface PreJoinLobbyProps {
  meetingTitle: string;
  slug: string;
  meetingData?: any;
  onJoin: (displayName: string) => void;
}

export function PreJoinLobby({ meetingTitle, slug, meetingData, onJoin }: PreJoinLobbyProps) {
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingRoom, setIsWaitingRoom] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    localStream,
    setLocalStream,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    setAudioMuted,
    setVideoMuted,
  } = useMediaStore();

  const accessLevel = meetingData?.accessLevel || "PUBLIC";
  const settings = meetingData?.settings || {};
  const isLocked = !!settings.lockMeeting;

  // Apply default muteOnJoin and cameraOffOnJoin settings
  useEffect(() => {
    if (settings.muteOnJoin) {
      setAudioMuted(true);
    }
    if (settings.cameraOffOnJoin) {
      setVideoMuted(true);
    }
  }, [settings.muteOnJoin, settings.cameraOffOnJoin, setAudioMuted, setVideoMuted]);

  useEffect(() => {
    // Acquire user media preview if not video muted
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

  // Handle Join & Verification Flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsVerifying(true);

    try {
      const result = await verifyMeetingAccessAction(slug, passcode.trim(), email.trim());
      if (!result.allowed) {
        setError(result.message || "Access denied to this meeting room.");
        setIsVerifying(false);
        return;
      }

      if (result.waitingRoom) {
        setIsWaitingRoom(true);
        setIsVerifying(false);
        return;
      }

      // Admitted immediately
      onJoin(name.trim());
    } catch {
      setError("Failed to verify credentials with meeting server.");
      setIsVerifying(false);
    }
  };

  // Waiting Room View
  if (isWaitingRoom) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-white text-xl font-bold">Waiting to be admitted...</h2>
            <p className="text-neutral-400 text-xs mt-1.5">
              The meeting host has been notified that you are waiting. You will join automatically once approved.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/5 w-full flex items-center justify-between text-xs">
            <span className="text-neutral-400">Joining as:</span>
            <span className="text-white font-medium">{name}</span>
          </div>

          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to host lobby...</span>
          </div>

          <button
            onClick={() => setIsWaitingRoom(false)}
            className="text-neutral-400 hover:text-white text-xs font-medium transition-colors"
          >
            Cancel & Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Locked Meeting Barrier
  if (isLocked) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-amber-500/20 shadow-2xl flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-white text-xl font-bold">Meeting is Locked</h2>
            <p className="text-neutral-400 text-xs mt-1.5">
              The host has locked this meeting room. No additional participants can enter at this time.
            </p>
          </div>

          <a
            href="/meetings"
            className="w-full py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
          >
            Back to Meetings Dashboard
          </a>
        </div>
      </div>
    );
  }

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

        {/* Right Column: Join & Access Form */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-white text-3xl font-bold tracking-tight">{meetingTitle}</h1>
            <p className="text-white/60 text-sm mt-1">Ready to join? Verify your details before entering.</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Your Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
              />
            </div>

            {/* If Private: Passcode Required */}
            {accessLevel === "PRIVATE" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="passcode" className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Meeting Passcode</span>
                </label>
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 6-digit meeting PIN"
                  required
                  className="w-full bg-neutral-900 border border-white/10 focus:border-amber-500 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-mono tracking-widest"
                />
              </div>
            )}

            {/* If Invite Only: Email Required */}
            {accessLevel === "INVITE_ONLY" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Invited Email Address</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the email your invite was sent to"
                  required
                  className="w-full bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={!name.trim() || isVerifying}
                className="flex-1 py-3.5 px-6 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95"
              >
                {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isVerifying ? "Verifying Access..." : settings.waitingRoomEnabled ? "Ask to Join" : "Join Now"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
