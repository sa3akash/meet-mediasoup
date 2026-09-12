"use client";

import { useEffect, useRef } from "react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { VideoTile } from "./video-tile";
import { ScreenShare } from "lucide-react";

interface MeetingGridProps {
  localDisplayName: string;
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch((err) => {
        console.warn("[Audio] Autoplay blocked:", err);
      });
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

function PresentationStage({
  displayName,
  stream,
  isLocal,
}: {
  displayName: string;
  stream: MediaStream | null;
  isLocal?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/95 border border-white/10 shadow-2xl flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-white text-xs font-semibold shadow-lg">
        <ScreenShare className="w-4 h-4 text-blue-400" />
        <span>{isLocal ? "You are presenting" : `${displayName} is presenting`}</span>
      </div>
    </div>
  );
}

export function MeetingGrid({ localDisplayName }: MeetingGridProps) {
  const {
    participants,
    activeSpeakerId,
    pinnedParticipantId,
    layoutMode,
    setPinnedParticipant,
  } = useMeetingStore();

  const {
    localStream,
    screenStream,
    isScreenSharing,
    remoteStreams,
    isAudioMuted,
    isVideoMuted,
  } = useMediaStore();

  const participantList = Array.from(participants.values());

  // Check if someone is sharing screen
  const remotePresenter = participantList.find(
    (p) => p.isScreenSharing || !!remoteStreams.get(p.id)?.screenStream
  );
  const isLocalPresenting = isScreenSharing && !!screenStream;
  const activePresenter = isLocalPresenting
    ? { isLocal: true, displayName: "You", stream: screenStream }
    : remotePresenter
    ? {
        isLocal: false,
        displayName: remotePresenter.displayName,
        stream: remoteStreams.get(remotePresenter.id)?.screenStream || null,
      }
    : null;

  const totalTiles = participantList.length + 1; // +1 for local participant

  // Dynamic grid column layout
  const getGridColsClass = () => {
    if (layoutMode === "SPOTLIGHT" || pinnedParticipantId) return "grid-cols-1";
    if (totalTiles <= 1) return "grid-cols-1";
    if (totalTiles <= 2) return "grid-cols-1 md:grid-cols-2";
    if (totalTiles <= 4) return "grid-cols-2";
    if (totalTiles <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  const pinnedParticipant = pinnedParticipantId
    ? participants.get(pinnedParticipantId)
    : null;

  return (
    <div className="relative w-full h-full p-4 flex items-center justify-center bg-neutral-950 overflow-hidden">
      {/* Invisible Audio Players for All Remote Participants */}
      {Array.from(remoteStreams.entries()).map(([peerId, media]) => {
        if (!media.audioStream) return null;
        return <RemoteAudio key={peerId} stream={media.audioStream} />;
      })}

      {/* 1. Presentation Stage Layout */}
      {activePresenter ? (
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          {/* Main Stage Presentation */}
          <div className="flex-1 h-full min-h-0">
            <PresentationStage
              displayName={activePresenter.displayName}
              stream={activePresenter.stream}
              isLocal={activePresenter.isLocal}
            />
          </div>

          {/* Filmstrip Sidebar with Webcams */}
          <div className="w-full md:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
            {/* Local tile */}
            <div className="h-40 min-w-[160px] md:min-w-full shrink-0">
              <VideoTile
                displayName={localDisplayName}
                stream={localStream}
                isMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                isLocal={true}
              />
            </div>

            {/* Remote participants */}
            {participantList.map((p) => (
              <div key={p.id} className="h-40 min-w-[160px] md:min-w-full shrink-0">
                <VideoTile
                  displayName={p.displayName}
                  avatarUrl={p.avatarUrl}
                  stream={remoteStreams.get(p.id)?.videoStream}
                  isMuted={p.isAudioMuted}
                  isVideoMuted={p.isVideoMuted}
                  isActiveSpeaker={activeSpeakerId === p.id}
                  isHandRaised={p.isHandRaised}
                  onPinToggle={() => setPinnedParticipant(p.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : pinnedParticipant ? (
        /* 2. Pinned Participant Stage Layout */
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-full min-h-0">
            <VideoTile
              displayName={pinnedParticipant.displayName}
              avatarUrl={pinnedParticipant.avatarUrl}
              stream={remoteStreams.get(pinnedParticipant.id)?.videoStream}
              isMuted={pinnedParticipant.isAudioMuted}
              isVideoMuted={pinnedParticipant.isVideoMuted}
              isActiveSpeaker={activeSpeakerId === pinnedParticipant.id}
              isPinned={true}
              onPinToggle={() => setPinnedParticipant(null)}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
            <div className="h-40 min-w-[160px] md:min-w-full shrink-0">
              <VideoTile
                displayName={localDisplayName}
                stream={localStream}
                isMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                isLocal={true}
              />
            </div>
            {participantList
              .filter((p) => p.id !== pinnedParticipantId)
              .map((p) => (
                <div key={p.id} className="h-40 min-w-[160px] md:min-w-full shrink-0">
                  <VideoTile
                    displayName={p.displayName}
                    avatarUrl={p.avatarUrl}
                    stream={remoteStreams.get(p.id)?.videoStream}
                    isMuted={p.isAudioMuted}
                    isVideoMuted={p.isVideoMuted}
                    isActiveSpeaker={activeSpeakerId === p.id}
                    isHandRaised={p.isHandRaised}
                    onPinToggle={() => setPinnedParticipant(p.id)}
                  />
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* 3. Normal Dynamic Grid Layout */
        <div className={`grid ${getGridColsClass()} gap-4 w-full h-full max-h-[85vh]`}>
          {/* Local User Tile */}
          <VideoTile
            displayName={localDisplayName}
            stream={localStream}
            isMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            isLocal={true}
            isActiveSpeaker={false}
          />

          {/* Remote Participants */}
          {participantList.map((participant) => (
            <VideoTile
              key={participant.id}
              displayName={participant.displayName}
              avatarUrl={participant.avatarUrl}
              stream={remoteStreams.get(participant.id)?.videoStream}
              isMuted={participant.isAudioMuted}
              isVideoMuted={participant.isVideoMuted}
              isActiveSpeaker={activeSpeakerId === participant.id}
              isHandRaised={participant.isHandRaised}
              onPinToggle={() => setPinnedParticipant(participant.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
