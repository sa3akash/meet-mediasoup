"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { VideoTile } from "./video-tile";
import {
  ScreenShare,
  Sparkles,
  Maximize2,
  Minimize2,
  Tv,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  User,
  LayoutGrid,
} from "lucide-react";

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

interface PresenterSession {
  id: string;
  displayName: string;
  stream: MediaStream | null;
  isLocal: boolean;
}

function PresentationStage({
  presenter,
  allPresenters,
  activePresenterId,
  onSelectPresenter,
  isTheaterMode,
  onToggleTheater,
}: {
  presenter: PresenterSession;
  allPresenters: PresenterSession[];
  activePresenterId: string | null;
  onSelectPresenter: (id: string) => void;
  isTheaterMode: boolean;
  onToggleTheater: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [objectFit, setObjectFit] = useState<"contain" | "cover">("contain");
  const [isDualView, setIsDualView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !presenter.stream) return;
    video.srcObject = presenter.stream;
    video.play().catch(() => {});

    const onAddTrack = () => {
      video.srcObject = presenter.stream;
      video.play().catch(() => {});
    };

    presenter.stream.addEventListener("addtrack", onAddTrack);
    return () => {
      presenter.stream?.removeEventListener("addtrack", onAddTrack);
    };
  }, [presenter.stream]);

  const hasLiveTrack = Boolean(
    presenter.stream &&
    presenter.stream.getVideoTracks().length > 0 &&
    presenter.stream.getVideoTracks().some((t) => t.readyState === "live")
  );

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const hasScreenAudio = Boolean(
    presenter.stream && presenter.stream.getAudioTracks().length > 0
  );

  const canDualView = allPresenters.length >= 2;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col items-center justify-center group"
    >
      {/* Top Header / Multi-Presentation Tabs Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Presentation Tab Switchers (Multiple Share Sessions) */}
        <div className="flex items-center gap-2 pointer-events-auto overflow-x-auto max-w-[70%]">
          {allPresenters.length > 1 && (
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-lg">
              {allPresenters.map((p) => {
                const isSelected = !isDualView && (activePresenterId ? activePresenterId === p.id : presenter.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setIsDualView(false);
                      onSelectPresenter(p.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <ScreenShare className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[120px]">
                      {p.isLocal ? "Your Screen" : `${p.displayName}'s Screen`}
                    </span>
                  </button>
                );
              })}
              {canDualView && (
                <button
                  onClick={() => setIsDualView(!isDualView)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isDualView
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span>Dual View</span>
                </button>
              )}
            </div>
          )}

          {allPresenters.length <= 1 && (
            <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-white text-xs font-semibold shadow-lg">
              <ScreenShare className="w-4 h-4 text-blue-400" />
              <span>{presenter.isLocal ? "You are presenting" : `${presenter.displayName} is presenting`}</span>
              {hasScreenAudio && (
                <span className="flex items-center gap-1 text-[11px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded">
                  <Volume2 className="w-3 h-3" /> Audio
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Remote Presentation Mode Controls (Viewer Controls) */}
        <div className="bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1 pointer-events-auto shadow-lg opacity-90 hover:opacity-100 transition-opacity">
          {/* Fit / Fill toggle */}
          <button
            onClick={() => setObjectFit(objectFit === "contain" ? "cover" : "contain")}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={objectFit === "contain" ? "Fill Viewport" : "Fit to Viewport"}
          >
            {objectFit === "contain" ? (
              <span className="text-[11px] font-semibold px-1">100%</span>
            ) : (
              <span className="text-[11px] font-semibold px-1">Fit</span>
            )}
          </button>

          {/* Theater mode toggle (Hide webcams filmstrip) */}
          <button
            onClick={onToggleTheater}
            className={`p-1.5 rounded-lg transition-colors ${
              isTheaterMode
                ? "bg-indigo-600 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title={isTheaterMode ? "Exit Theater Mode (Show Webcams)" : "Theater Mode (Full Screen Slide Focus)"}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport (Single or Dual Side-by-Side) */}
      {!isDualView ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
            onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
            className={`w-full h-full ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
          />
          {!hasLiveTrack && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 text-xs gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center animate-pulse">
                <ScreenShare className="w-6 h-6" />
              </div>
              <span>Receiving screen share stream...</span>
            </div>
          )}
        </div>
      ) : (
        /* Dual Presentation Side-by-Side */
        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
          {allPresenters.slice(0, 2).map((p) => (
            <div
              key={p.id}
              className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-950 border border-white/5 flex items-center justify-center"
            >
              <video
                autoPlay
                playsInline
                muted={true}
                ref={(el) => {
                  if (el && p.stream) {
                    el.srcObject = p.stream;
                    el.play().catch(() => {});
                  }
                }}
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold border border-white/10">
                {p.isLocal ? "Your Screen" : `${p.displayName}'s Screen`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MeetingGrid({ localDisplayName }: MeetingGridProps) {
  const {
    participants,
    myParticipantId,
    activeSpeakerId,
    pinnedParticipantId,
    spotlightParticipantId,
    activePresenterId,
    setActivePresenterId,
    isTheaterMode,
    toggleTheaterMode,
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

  const participantList = useMemo(() => {
    return Array.from(participants.values()).filter((p) => p.id !== myParticipantId);
  }, [participants, myParticipantId]);

  // Collect All Active Screen Presenters (Multiple Share Sessions Support)
  const allPresenters = useMemo(() => {
    const list: PresenterSession[] = [];
    if (isScreenSharing && screenStream) {
      list.push({
        id: "local",
        displayName: "You",
        stream: screenStream,
        isLocal: true,
      });
    }
    participantList.forEach((p) => {
      const rMedia = remoteStreams.get(p.id);
      if (p.isScreenSharing || !!rMedia?.screenStream) {
        list.push({
          id: p.id,
          displayName: p.displayName || "Participant",
          stream: rMedia?.screenStream || null,
          isLocal: false,
        });
      }
    });
    return list;
  }, [isScreenSharing, screenStream, participantList, remoteStreams]);

  // Selected Active Presenter
  const activePresenter = useMemo(() => {
    if (allPresenters.length === 0) return null;
    if (activePresenterId) {
      const found = allPresenters.find((p) => p.id === activePresenterId);
      if (found) return found;
    }
    return allPresenters[0];
  }, [allPresenters, activePresenterId]);

  // Active Speaker detection
  const activeSpeaker = useMemo(() => {
    if (!activeSpeakerId) return null;
    if (activeSpeakerId === myParticipantId) {
      return {
        id: myParticipantId,
        displayName: `${localDisplayName} (You)`,
        isLocal: true,
        stream: localStream,
        isAudioMuted,
        isVideoMuted,
      };
    }
    const remote = participants.get(activeSpeakerId);
    if (!remote) return null;
    return {
      id: remote.id,
      displayName: remote.displayName,
      isLocal: false,
      stream: remoteStreams.get(remote.id)?.videoStream || null,
      isAudioMuted: remote.isAudioMuted,
      isVideoMuted: remote.isVideoMuted,
    };
  }, [
    activeSpeakerId,
    myParticipantId,
    localDisplayName,
    localStream,
    isAudioMuted,
    isVideoMuted,
    participants,
    remoteStreams,
  ]);

  // Spotlight participant check
  const isSpotlightActive = Boolean(spotlightParticipantId);
  const isLocalSpotlighted = spotlightParticipantId === myParticipantId;
  const spotlightRemoteParticipant = spotlightParticipantId
    ? participants.get(spotlightParticipantId)
    : null;

  const pinnedParticipant = pinnedParticipantId ? participants.get(pinnedParticipantId) : null;

  // Virtualized Grid Pagination (Performance Optimization for large rooms > 12 participants)
  const [gridPage, setGridPage] = useState(0);
  const TILES_PER_PAGE = 12;

  // Total Tiles
  const allTileParticipants = useMemo(() => {
    return [
      {
        id: "local",
        displayName: localDisplayName,
        avatarUrl: null as string | null | undefined,
        stream: localStream,
        isAudioMuted,
        isVideoMuted,
        isLocal: true,
        isHandRaised: false,
      },
      ...participantList.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        stream: remoteStreams.get(p.id)?.videoStream || null,
        isAudioMuted: p.isAudioMuted,
        isVideoMuted: p.isVideoMuted,
        isLocal: false,
        isHandRaised: p.isHandRaised,
      })),
    ];
  }, [localDisplayName, localStream, isAudioMuted, isVideoMuted, participantList, remoteStreams]);

  const totalPages = Math.ceil(allTileParticipants.length / TILES_PER_PAGE);
  const paginatedTiles = allTileParticipants.slice(
    gridPage * TILES_PER_PAGE,
    (gridPage + 1) * TILES_PER_PAGE
  );

  // Dynamic grid column layout
  const getGridColsClass = (tileCount: number) => {
    if (tileCount <= 1) return "grid-cols-1";
    if (tileCount <= 2) return "grid-cols-1 md:grid-cols-2";
    if (tileCount <= 4) return "grid-cols-2";
    if (tileCount <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // Determine Primary Active Layout Mode
  // If user explicitly chose PRESENTATION or someone is presenting, presentation mode is prioritized
  const effectiveLayout =
    activePresenter
      ? "PRESENTATION"
      : layoutMode;

  return (
    <div className="relative w-full h-full p-4 flex items-center justify-center bg-neutral-950 overflow-hidden">
      {/* Invisible Audio Players for All Remote Participants */}
      {Array.from(remoteStreams.entries()).map(([peerId, media]) => {
        if (!media.audioStream) return null;
        return <RemoteAudio key={peerId} stream={media.audioStream} />;
      })}

      {/* 1. PRESENTATION VIEW */}
      {effectiveLayout === "PRESENTATION" && activePresenter ? (
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          {/* Main Stage Presentation Viewport */}
          <div className="flex-1 h-full min-h-0">
            <PresentationStage
              presenter={activePresenter}
              allPresenters={allPresenters}
              activePresenterId={activePresenterId}
              onSelectPresenter={setActivePresenterId}
              isTheaterMode={isTheaterMode}
              onToggleTheater={toggleTheaterMode}
            />
          </div>

          {/* Filmstrip Sidebar (Hidden when Theater Mode is Active) */}
          {!isTheaterMode && (
            <div className="w-full md:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
              <div className="h-40 min-w-[160px] md:min-w-full shrink-0">
                <VideoTile
                  displayName={localDisplayName}
                  stream={localStream}
                  isMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  isLocal={true}
                />
              </div>

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
          )}
        </div>
      ) : effectiveLayout === "SPEAKER" && (activeSpeaker || pinnedParticipant) ? (
        /* 2. SPEAKER VIEW (Active Speaker Auto Focus) */
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-full min-h-0 relative">
            {pinnedParticipant ? (
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
            ) : activeSpeaker ? (
              <>
                <VideoTile
                  displayName={activeSpeaker.displayName}
                  stream={activeSpeaker.stream}
                  isMuted={activeSpeaker.isAudioMuted}
                  isVideoMuted={activeSpeaker.isVideoMuted}
                  isLocal={activeSpeaker.isLocal}
                  isActiveSpeaker={true}
                />
                <div className="absolute top-4 left-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Active Speaker</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Filmstrip */}
          <div className="w-full md:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
            {(!activeSpeaker || !activeSpeaker.isLocal) && (
              <div className="h-40 min-w-[160px] md:min-w-full shrink-0">
                <VideoTile
                  displayName={localDisplayName}
                  stream={localStream}
                  isMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  isLocal={true}
                />
              </div>
            )}
            {participantList
              .filter((p) => p.id !== (pinnedParticipantId || activeSpeaker?.id))
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
      ) : effectiveLayout === "SPOTLIGHT" && (isSpotlightActive || pinnedParticipant) ? (
        /* 3. SPOTLIGHT VIEW (Featured Focus with Golden Aura) */
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-full min-h-0 relative">
            <VideoTile
              displayName={
                isLocalSpotlighted
                  ? `${localDisplayName} (You)`
                  : spotlightRemoteParticipant?.displayName || pinnedParticipant?.displayName || "Participant"
              }
              avatarUrl={spotlightRemoteParticipant?.avatarUrl || pinnedParticipant?.avatarUrl}
              stream={
                isLocalSpotlighted
                  ? localStream
                  : remoteStreams.get(spotlightParticipantId || pinnedParticipantId!)?.videoStream
              }
              isMuted={
                isLocalSpotlighted
                  ? isAudioMuted
                  : spotlightRemoteParticipant?.isAudioMuted ?? pinnedParticipant?.isAudioMuted
              }
              isVideoMuted={
                isLocalSpotlighted
                  ? isVideoMuted
                  : spotlightRemoteParticipant?.isVideoMuted ?? pinnedParticipant?.isVideoMuted
              }
              isLocal={isLocalSpotlighted}
              isActiveSpeaker={activeSpeakerId === (spotlightParticipantId || pinnedParticipantId)}
            />
            <div className="absolute top-4 left-4 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSpotlightActive ? "Spotlighted for everyone" : "Pinned"}</span>
            </div>
          </div>

          {/* Filmstrip */}
          <div className="w-full md:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
            {!isLocalSpotlighted && (
              <div className="h-40 min-w-[160px] md:min-w-full shrink-0">
                <VideoTile
                  displayName={localDisplayName}
                  stream={localStream}
                  isMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  isLocal={true}
                />
              </div>
            )}
            {participantList
              .filter((p) => p.id !== (spotlightParticipantId || pinnedParticipantId))
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
      ) : effectiveLayout === "SIDEBAR" ? (
        /* 4. SIDEBAR VIEW (Large Main Stage with Right Vertical Filmstrip) */
        <div className="w-full h-full flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-full min-h-0">
            {pinnedParticipant ? (
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
            ) : activeSpeaker ? (
              <VideoTile
                displayName={activeSpeaker.displayName}
                stream={activeSpeaker.stream}
                isMuted={activeSpeaker.isAudioMuted}
                isVideoMuted={activeSpeaker.isVideoMuted}
                isLocal={activeSpeaker.isLocal}
                isActiveSpeaker={true}
              />
            ) : (
              <VideoTile
                displayName={localDisplayName}
                stream={localStream}
                isMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                isLocal={true}
              />
            )}
          </div>

          <div className="w-full md:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto shrink-0">
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
      ) : (
        /* 5. GRID VIEW (Virtualized Responsive Grid with Pagination) */
        <div className="w-full h-full flex flex-col justify-between items-center relative">
          <div
            className={`grid ${getGridColsClass(
              paginatedTiles.length
            )} gap-4 w-full h-full max-h-[82vh]`}
          >
            {paginatedTiles.map((tile) => (
              <VideoTile
                key={tile.id}
                displayName={tile.displayName}
                avatarUrl={tile.avatarUrl}
                stream={tile.stream}
                isMuted={tile.isAudioMuted}
                isVideoMuted={tile.isVideoMuted}
                isLocal={tile.isLocal}
                isActiveSpeaker={activeSpeakerId === tile.id}
                isHandRaised={tile.isHandRaised}
                onPinToggle={
                  !tile.isLocal ? () => setPinnedParticipant(tile.id) : undefined
                }
              />
            ))}
          </div>

          {/* Pagination Controls for Large Virtualized Rooms */}
          {totalPages > 1 && (
            <div className="mt-3 bg-neutral-900/90 border border-white/10 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-3 text-xs text-white/80">
              <button
                onClick={() => setGridPage((p) => Math.max(0, p - 1))}
                disabled={gridPage === 0}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Page {gridPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setGridPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={gridPage >= totalPages - 1}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
