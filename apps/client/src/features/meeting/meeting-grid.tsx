"use client";

import { useState, useMemo } from "react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { VideoTile } from "./video-tile";
import { PresentationStage, type PresenterSession } from "./components/presentation-stage";
import { RemoteAudio } from "./components/remote-audio";
import { GridPagination } from "./components/grid-pagination";

export function MeetingGrid({ localDisplayName }: { localDisplayName: string }) {
  const {
    participants, myParticipantId, activeSpeakerId, pinnedParticipantId,
    spotlightParticipantId, activePresenterId, setActivePresenterId,
    isTheaterMode, toggleTheaterMode, layoutMode, setPinnedParticipant,
  } = useMeetingStore();

  const { localStream, screenStream, isScreenSharing, remoteStreams, isAudioMuted, isVideoMuted } = useMediaStore();
  const [gridPage, setGridPage] = useState(0);
  const TILES_PER_PAGE = 12;

  const participantList = useMemo(() => Array.from(participants.values()).filter((p) => p.id !== myParticipantId), [participants, myParticipantId]);

  const allPresenters = useMemo(() => {
    const list: PresenterSession[] = [];
    if (isScreenSharing && screenStream) list.push({ id: "local", displayName: `${localDisplayName} (You)`, stream: screenStream, isLocal: true });
    participantList.forEach((p) => {
      const rMedia = remoteStreams.get(p.id);
      if (p.isScreenSharing && rMedia?.screenStream) list.push({ id: p.id, displayName: p.displayName || "Participant", stream: rMedia.screenStream, isLocal: false });
    });
    return list;
  }, [isScreenSharing, screenStream, participantList, remoteStreams, localDisplayName]);

  const activePresenter = useMemo(() => allPresenters.find((p) => p.id === activePresenterId) || allPresenters[0] || null, [allPresenters, activePresenterId]);

  const allTileParticipants = useMemo(() => [
    { id: "local", displayName: localDisplayName, avatarUrl: null, stream: localStream, isAudioMuted, isVideoMuted, isLocal: true, isHandRaised: false },
    ...participantList.map((p) => ({ id: p.id, displayName: p.displayName, avatarUrl: p.avatarUrl, stream: remoteStreams.get(p.id)?.videoStream || null, isAudioMuted: p.isAudioMuted, isVideoMuted: p.isVideoMuted, isLocal: false, isHandRaised: p.isHandRaised })),
  ], [localDisplayName, localStream, isAudioMuted, isVideoMuted, participantList, remoteStreams]);

  const totalPages = Math.ceil(allTileParticipants.length / TILES_PER_PAGE);
  const paginatedTiles = allTileParticipants.slice(gridPage * TILES_PER_PAGE, (gridPage + 1) * TILES_PER_PAGE);

  const getCols = (c: number) => c <= 1 ? "grid-cols-1" : c <= 2 ? "grid-cols-1 sm:grid-cols-2" : c <= 4 ? "grid-cols-2" : c <= 6 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  const effectiveLayout = activePresenter ? "PRESENTATION" : layoutMode;
  const pinnedParticipant = (pinnedParticipantId ? participants.get(pinnedParticipantId) : null) ||
    (spotlightParticipantId ? participants.get(spotlightParticipantId) : null);

  return (
    <div className="relative w-full h-full p-2 sm:p-4 flex items-center justify-center bg-neutral-950 overflow-hidden">
      {Array.from(remoteStreams.entries()).map(([peerId, media]) => media.audioStream && <RemoteAudio key={peerId} stream={media.audioStream} />)}

      {effectiveLayout === "PRESENTATION" && activePresenter ? (
        <div className="w-full h-full flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-full min-h-0">
            <PresentationStage presenter={activePresenter} allPresenters={allPresenters} activePresenterId={activePresenterId} onSelectPresenter={setActivePresenterId} isTheaterMode={isTheaterMode} onToggleTheater={toggleTheaterMode} />
          </div>
          {!isTheaterMode && (
            <div className="w-full md:w-64 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
              {allTileParticipants.map((t) => (
                <div key={t.id} className="h-32 min-w-[140px] md:min-w-full shrink-0">
                  <VideoTile displayName={t.displayName} avatarUrl={t.avatarUrl} stream={t.stream} isMuted={t.isAudioMuted} isVideoMuted={t.isVideoMuted} isLocal={t.isLocal} isActiveSpeaker={activeSpeakerId === t.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : effectiveLayout === "SIDEBAR" && pinnedParticipant ? (
        <div className="w-full h-full flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-full min-h-0">
            <VideoTile displayName={pinnedParticipant.displayName} avatarUrl={pinnedParticipant.avatarUrl} stream={remoteStreams.get(pinnedParticipant.id)?.videoStream} isMuted={pinnedParticipant.isAudioMuted} isVideoMuted={pinnedParticipant.isVideoMuted} isActiveSpeaker={activeSpeakerId === pinnedParticipant.id} isPinned onPinToggle={() => setPinnedParticipant(null)} />
          </div>
          <div className="w-full md:w-64 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
            {participantList.map((p) => (
              <div key={p.id} className="h-32 min-w-[140px] md:min-w-full shrink-0">
                <VideoTile displayName={p.displayName} avatarUrl={p.avatarUrl} stream={remoteStreams.get(p.id)?.videoStream} isMuted={p.isAudioMuted} isVideoMuted={p.isVideoMuted} isActiveSpeaker={activeSpeakerId === p.id} onPinToggle={() => setPinnedParticipant(p.id)} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col justify-between items-center relative">
          <div className={`grid ${getCols(paginatedTiles.length)} gap-2 sm:gap-4 w-full h-full max-h-[82vh]`}>
            {paginatedTiles.map((tile) => (
              <VideoTile key={tile.id} displayName={tile.displayName} avatarUrl={tile.avatarUrl} stream={tile.stream} isMuted={tile.isAudioMuted} isVideoMuted={tile.isVideoMuted} isLocal={tile.isLocal} isActiveSpeaker={activeSpeakerId === tile.id} isHandRaised={tile.isHandRaised} onPinToggle={!tile.isLocal ? () => setPinnedParticipant(tile.id) : undefined} />
            ))}
          </div>
          <GridPagination currentPage={gridPage} totalPages={totalPages} onPageChange={setGridPage} />
        </div>
      )}
    </div>
  );
}
