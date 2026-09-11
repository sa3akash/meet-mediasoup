"use client";

import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { VideoTile } from "./video-tile";

interface MeetingGridProps {
  localDisplayName: string;
}

export function MeetingGrid({ localDisplayName }: MeetingGridProps) {
  const { participants, activeSpeakerId, pinnedParticipantId, layoutMode, setPinnedParticipant } = useMeetingStore();
  const { localStream, remoteStreams, isAudioMuted } = useMediaStore();

  const participantList = Array.from(participants.values());
  const totalTiles = participantList.length + 1; // +1 for local participant

  // Determine dynamic grid columns
  const getGridColsClass = () => {
    if (layoutMode === "SPOTLIGHT" || pinnedParticipantId) return "grid-cols-1";
    if (totalTiles <= 1) return "grid-cols-1";
    if (totalTiles <= 2) return "grid-cols-1 md:grid-cols-2";
    if (totalTiles <= 4) return "grid-cols-2";
    if (totalTiles <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // If a participant is pinned or spotlighted
  const pinnedParticipant = pinnedParticipantId ? participants.get(pinnedParticipantId) : null;

  return (
    <div className="relative w-full h-full p-4 flex items-center justify-center bg-neutral-950 overflow-hidden">
      {pinnedParticipant ? (
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          {/* Main Stage */}
          <div className="flex-1 h-full">
            <VideoTile
              displayName={pinnedParticipant.displayName}
              avatarUrl={pinnedParticipant.avatarUrl}
              stream={remoteStreams.get(pinnedParticipant.id)?.videoStream}
              isMuted={pinnedParticipant.isAudioMuted}
              isActiveSpeaker={activeSpeakerId === pinnedParticipant.id}
              isPinned={true}
              onPinToggle={() => setPinnedParticipant(null)}
            />
          </div>
          {/* Filmstrip Sidebar */}
          <div className="w-full md:w-64 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto">
            {/* Local tile */}
            <div className="h-36 min-w-[140px] md:min-w-full">
              <VideoTile
                displayName={localDisplayName}
                stream={localStream}
                isMuted={isAudioMuted}
                isLocal={true}
              />
            </div>
            {participantList
              .filter((p) => p.id !== pinnedParticipantId)
              .map((p) => (
                <div key={p.id} className="h-36 min-w-[140px] md:min-w-full">
                  <VideoTile
                    displayName={p.displayName}
                    avatarUrl={p.avatarUrl}
                    stream={remoteStreams.get(p.id)?.videoStream}
                    isMuted={p.isAudioMuted}
                    isActiveSpeaker={activeSpeakerId === p.id}
                    onPinToggle={() => setPinnedParticipant(p.id)}
                  />
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className={`grid ${getGridColsClass()} gap-4 w-full h-full max-h-[85vh]`}>
          {/* Local User Tile */}
          <VideoTile
            displayName={localDisplayName}
            stream={localStream}
            isMuted={isAudioMuted}
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
