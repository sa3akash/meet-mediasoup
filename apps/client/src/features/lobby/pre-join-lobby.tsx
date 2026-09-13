"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useMediaStore } from "../../stores/media-store";
import { verifyMeetingAccessAction } from "../../actions/meeting-access.actions";
import { LobbyPreviewCard } from "./components/lobby-preview-card";
import { LobbyStatusBarrier } from "./components/lobby-status-barrier";
import { LobbyForm } from "./components/lobby-form";

interface PreJoinLobbyProps {
  meetingTitle: string;
  slug: string;
  meetingData?: any;
  userId?: string;
  initialDisplayName?: string;
  onJoin: (displayName: string) => void;
}

export function PreJoinLobby({
  meetingTitle,
  slug,
  meetingData,
  userId,
  initialDisplayName = "",
  onJoin,
}: PreJoinLobbyProps) {
  const [name, setName] = useState(initialDisplayName);
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingRoom, setIsWaitingRoom] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
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
  const hasPasscode = Boolean(meetingData?.passcode) || Boolean(meetingData?.hasPasscode);

  useEffect(() => {
    if (settings.muteOnJoin) setAudioMuted(true);
    if (settings.cameraOffOnJoin) setVideoMuted(true);
  }, [settings.muteOnJoin, settings.cameraOffOnJoin, setAudioMuted, setVideoMuted]);

  useEffect(() => {
    async function getPreview() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        setLocalStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.warn("Camera or microphone permission denied or unavailable:", e);
      }
    }
    getPreview();
  }, [setLocalStream]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsVerifying(true);

    try {
      const result = await verifyMeetingAccessAction(
        slug,
        passcode.trim(),
        email.trim(),
        userId || meetingData?.hostId
      );
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

      onJoin(name.trim());
    } catch {
      setError("Failed to verify credentials with meeting server.");
      setIsVerifying(false);
    }
  };

  if (isWaitingRoom) {
    return (
      <LobbyStatusBarrier
        type="WAITING_ROOM"
        name={name}
        onCancelWaiting={() => setIsWaitingRoom(false)}
      />
    );
  }

  if (isLocked) {
    return <LobbyStatusBarrier type="LOCKED" />;
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <LobbyPreviewCard
          videoRef={videoRef}
          name={name}
          isVideoMuted={isVideoMuted}
          isAudioMuted={isAudioMuted}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          accessLevel={accessLevel}
        />

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

          <LobbyForm
            name={name}
            setName={setName}
            passcode={passcode}
            setPasscode={setPasscode}
            email={email}
            setEmail={setEmail}
            accessLevel={accessLevel}
            hasPasscode={hasPasscode}
            isVerifying={isVerifying}
            waitingRoomEnabled={Boolean(settings.waitingRoomEnabled)}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
