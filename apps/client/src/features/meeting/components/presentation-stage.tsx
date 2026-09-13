"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  ScreenShare,
  Maximize2,
  Minimize2,
  Tv,
  Volume2,
} from "lucide-react";

export interface PresenterSession {
  id: string;
  displayName: string;
  stream: MediaStream | null;
  isLocal: boolean;
}

interface PresentationStageProps {
  presenter: PresenterSession;
  allPresenters: PresenterSession[];
  activePresenterId: string | null;
  onSelectPresenter: (id: string) => void;
  isTheaterMode: boolean;
  onToggleTheater: () => void;
}

export function PresentationStage({
  presenter,
  allPresenters,
  activePresenterId,
  onSelectPresenter,
  isTheaterMode,
  onToggleTheater,
}: PresentationStageProps) {
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
  }, [presenter.stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const hasScreenAudio = Boolean(presenter.stream?.getAudioTracks().length);

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col items-center justify-center group">
      {/* Top Header */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto overflow-x-auto max-w-[70%]">
          {allPresenters.length > 1 ? (
            <div className="bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-lg">
              {allPresenters.map((p) => {
                const isSelected = !isDualView && (activePresenterId ? activePresenterId === p.id : presenter.id === p.id);
                return (
                  <button key={p.id} onClick={() => { setIsDualView(false); onSelectPresenter(p.id); }} className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${isSelected ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"}`}>
                    <ScreenShare className="w-3.5 h-3.5" />
                    <span className="truncate max-w-30">{p.isLocal ? "Your Screen" : `${p.displayName}'s Screen`}</span>
                  </button>
                );
              })}
              <button onClick={() => setIsDualView(!isDualView)} className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDualView ? "bg-indigo-600 text-white" : "text-white/60 hover:text-white"}`}>
                Dual View
              </button>
            </div>
          ) : (
            <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-white text-xs font-semibold">
              <ScreenShare className="w-4 h-4 text-blue-400" />
              <span>{presenter.isLocal ? "You are presenting" : `${presenter.displayName} is presenting`}</span>
              {hasScreenAudio && <span className="flex items-center gap-1 text-[11px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded"><Volume2 className="w-3 h-3" /> Audio</span>}
            </div>
          )}
        </div>

        <div className="bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1 pointer-events-auto shadow-lg">
          <button onClick={() => setObjectFit(objectFit === "contain" ? "cover" : "contain")} className="p-1.5 rounded-lg text-white/70 hover:text-white text-[11px] font-semibold">
            {objectFit === "contain" ? "100%" : "Fit"}
          </button>
          <button onClick={onToggleTheater} className={`p-1.5 rounded-lg ${isTheaterMode ? "bg-indigo-600 text-white" : "text-white/70 hover:text-white"}`}>
            <Tv className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg text-white/70 hover:text-white">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      {!isDualView ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full ${objectFit === "contain" ? "object-contain" : "object-cover"}`} />
        </div>
      ) : (
        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
          {allPresenters.slice(0, 2).map((p) => (
            <div key={p.id} className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-950 border border-white/5 flex items-center justify-center">
              <video autoPlay playsInline muted ref={(el) => { if (el && p.stream) { el.srcObject = p.stream; el.play().catch(() => {}); } }} className="w-full h-full object-contain" />
              <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold">
                {p.isLocal ? "Your Screen" : `${p.displayName}'s Screen`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
