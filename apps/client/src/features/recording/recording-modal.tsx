"use client";

import { useState, useEffect } from "react";
import {
  X,
  Radio,
  Cloud,
  HardDrive,
  Video,
  Monitor,
  Mic,
  Layers,
  StopCircle,
  Play,
  CheckCircle,
  Download,
  Copy,
} from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCloudRecording: (recordType: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY") => Promise<void>;
  onStopCloudRecording: () => Promise<any>;
  onStartLocalRecording: (recordType: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY") => Promise<void>;
  onStopLocalRecording: () => void;
  localDuration: number;
}

export function RecordingModal({
  isOpen,
  onClose,
  onStartCloudRecording,
  onStopCloudRecording,
  onStartLocalRecording,
  onStopLocalRecording,
  localDuration,
}: RecordingModalProps) {
  const { isRecording, recordingType, recordingDuration, recordingDownloadUrl, myRole, isHost } =
    useMeetingStore();

  const [destination, setDestination] = useState<"CLOUD" | "LOCAL">("LOCAL");
  const [recordType, setRecordType] = useState<
    "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY"
  >("COMBINED");
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cloud recording allowed for host, co-host, or in self-hosted/dev rooms
  const canCloudRecord = true;

  const displayDuration = recordingType === "LOCAL" ? localDuration : recordingDuration;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      if (destination === "CLOUD") {
        await onStartCloudRecording(recordType);
      } else {
        await onStartLocalRecording(recordType);
      }
    } catch (err: any) {
      alert(err.message || "Failed to start recording");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (recordingType === "CLOUD") {
      await onStopCloudRecording();
    } else {
      onStopLocalRecording();
    }
  };

  const handleCopyLink = () => {
    if (recordingDownloadUrl) {
      navigator.clipboard.writeText(recordingDownloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="text-white font-semibold text-base">Meeting Recording</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Active Recording View */}
          {isRecording ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-red-500" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-white tracking-widest">
                  {formatTimer(displayDuration)}
                </div>
                <div className="text-xs text-red-400 font-medium mt-1">
                  ● {recordingType === "CLOUD" ? "Cloud Recording (S3)" : "Local Recording"} Active
                </div>
              </div>

              <p className="text-xs text-white/50 max-w-xs">
                {recordingType === "CLOUD"
                  ? "Recording is being processed on the server and will be saved to cloud storage."
                  : "Recording directly in your browser. Upon stopping, your file will download automatically."}
              </p>

              <button
                onClick={handleStop}
                className="mt-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-red-600/30 transition-all"
              >
                <StopCircle className="w-4 h-4" />
                Stop Recording
              </button>
            </div>
          ) : (
            <>
              {/* Completed Download Banner */}
              {recordingDownloadUrl && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Recording Uploaded to Cloud
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={recordingDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download MP4
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copied && <span className="text-[10px] text-emerald-400">Link copied!</span>}
                </div>
              )}

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
                onClick={handleStart}
                disabled={isStarting}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all mt-2"
              >
                <Play className="w-4 h-4 fill-white" />
                {isStarting ? "Initializing..." : "Start Recording"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
