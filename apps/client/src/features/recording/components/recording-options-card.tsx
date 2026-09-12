"use client";

import { HardDrive, Cloud, Layers, Monitor, Video, Mic, Play } from "lucide-react";

interface RecordingOptionsCardProps {
  destination: "CLOUD" | "LOCAL";
  setDestination: (dest: "CLOUD" | "LOCAL") => void;
  recordType: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY";
  setRecordType: (type: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY") => void;
  canCloudRecord: boolean;
  isStarting: boolean;
  onStart: () => void;
}

export function RecordingOptionsCard({
  destination,
  setDestination,
  recordType,
  setRecordType,
  canCloudRecord,
  isStarting,
  onStart,
}: RecordingOptionsCardProps) {
  return (
    <>
      {/* Destination Selector */}
      <div>
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
          Recording Destination
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setDestination("LOCAL")}
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
              destination === "LOCAL"
                ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                : "bg-neutral-800/60 border-white/10 text-white/70 hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Local Device
            </div>
            <span className="text-[11px] text-white/40">
              Save WebM/MP4 directly to your machine
            </span>
          </button>

          <button
            type="button"
            disabled={!canCloudRecord}
            onClick={() => setDestination("CLOUD")}
            className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
              destination === "CLOUD"
                ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                : "bg-neutral-800/60 border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <Cloud className="w-4 h-4 text-cyan-400" />
              Cloud (S3)
            </div>
            <span className="text-[11px] text-white/40">
              {canCloudRecord
                ? "Transmux to MP4 & HLS on server"
                : "Host/Co-host permission required"}
            </span>
          </button>
        </div>
      </div>

      {/* Recording Mode */}
      <div>
        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
          Recording Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "COMBINED", label: "Combined View", desc: "Screen, video & audio", icon: Layers },
            { id: "SCREEN_ONLY", label: "Screen Share", desc: "Presenter screen & audio", icon: Monitor },
            { id: "VIDEO_ONLY", label: "Video Only", desc: "Camera video & audio", icon: Video },
            { id: "AUDIO_ONLY", label: "Audio Only", desc: "Low-bandwidth podcast", icon: Mic },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = recordType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setRecordType(mode.id as any)}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  isSelected
                    ? "bg-white/10 border-indigo-500 text-white"
                    : "bg-neutral-800/40 border-white/5 text-white/60 hover:bg-white/5"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-indigo-600 text-white" : "bg-white/10 text-white/60"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">{mode.label}</div>
                  <div className="text-[10px] text-white/40 truncate">{mode.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={isStarting}
        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all mt-2"
      >
        <Play className="w-4 h-4 fill-white" />
        {isStarting ? "Initializing..." : "Start Recording"}
      </button>
    </>
  );
}
