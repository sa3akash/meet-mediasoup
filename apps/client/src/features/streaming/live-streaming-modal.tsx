"use client";

import React, { useState } from "react";
import {
  Radio,
  Globe,
  Plus,
  Trash2,
  Play,
  Square,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface StreamingDestinationForm {
  id: string;
  platform: "YOUTUBE" | "FACEBOOK" | "CUSTOM_RTMP";
  rtmpUrl: string;
  streamKey: string;
}

interface LiveStreamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStreaming: (params: { destinations: any[] }) => Promise<any>;
  onStopStreaming: (destinationId?: string) => Promise<any>;
}

export const LiveStreamingModal: React.FC<LiveStreamingModalProps> = ({
  isOpen,
  onClose,
  onStartStreaming,
  onStopStreaming,
}) => {
  const { isLiveStreaming, liveStreamingDestinations } = useMeetingStore();
  const [destinations, setDestinations] = useState<StreamingDestinationForm[]>([
    {
      id: "1",
      platform: "YOUTUBE",
      rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
      streamKey: "",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const addDestination = () => {
    setDestinations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        platform: "CUSTOM_RTMP",
        rtmpUrl: "",
        streamKey: "",
      },
    ]);
  };

  const removeDestination = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDestination = (
    id: string,
    field: keyof StreamingDestinationForm,
    value: string
  ) => {
    setDestinations((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, [field]: value };
        if (field === "platform") {
          if (value === "YOUTUBE") updated.rtmpUrl = "rtmp://a.rtmp.youtube.com/live2";
          else if (value === "FACEBOOK") updated.rtmpUrl = "rtmps://live-api-s.facebook.com:443/rtmp";
          else if (value === "CUSTOM_RTMP" && !updated.rtmpUrl) updated.rtmpUrl = "rtmp://";
        }
        return updated;
      })
    );
  };

  const handleStart = async () => {
    setErrorMsg(null);
    for (const d of destinations) {
      if (!d.streamKey && d.platform !== "CUSTOM_RTMP") {
        setErrorMsg(`Please enter a stream key for ${d.platform}`);
        return;
      }
      if (!d.rtmpUrl) {
        setErrorMsg("Please enter an RTMP destination URL");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onStartStreaming({ destinations });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start live stream");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsSubmitting(true);
    try {
      await onStopStreaming();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to stop live stream");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900/95 border border-slate-700/60 shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLiveStreaming ? "bg-red-500/20 text-red-400" : "bg-indigo-500/20 text-indigo-400"}`}>
              <Radio className={`w-6 h-6 ${isLiveStreaming ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Live Streaming
                {isLiveStreaming && (
                  <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium tracking-wider border border-red-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    LIVE
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Broadcast this meeting to YouTube, Facebook, or custom RTMP endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Streaming Status / Multi-destination Configuration */}
        <div className="my-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {destinations.map((dest, index) => (
            <div
              key={dest.id}
              className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    Destination #{index + 1}
                  </span>
                  {dest.platform === "YOUTUBE" && (
                    <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                      <YoutubeIcon className="w-3.5 h-3.5" /> YouTube Live
                    </span>
                  )}
                  {dest.platform === "FACEBOOK" && (
                    <span className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                      <FacebookIcon className="w-3.5 h-3.5" /> Facebook Live
                    </span>
                  )}
                  {dest.platform === "CUSTOM_RTMP" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      <Globe className="w-3.5 h-3.5" /> Custom RTMP
                    </span>
                  )}
                </div>

                {destinations.length > 1 && !isLiveStreaming && (
                  <button
                    onClick={() => removeDestination(dest.id)}
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Platform Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLiveStreaming}
                  onClick={() => updateDestination(dest.id, "platform", "YOUTUBE")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    dest.platform === "YOUTUBE"
                      ? "bg-red-500/20 border-red-500/60 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <YoutubeIcon className="w-4 h-4 text-red-400" /> YouTube
                </button>
                <button
                  type="button"
                  disabled={isLiveStreaming}
                  onClick={() => updateDestination(dest.id, "platform", "FACEBOOK")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    dest.platform === "FACEBOOK"
                      ? "bg-blue-500/20 border-blue-500/60 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FacebookIcon className="w-4 h-4 text-blue-400" /> Facebook
                </button>
                <button
                  type="button"
                  disabled={isLiveStreaming}
                  onClick={() => updateDestination(dest.id, "platform", "CUSTOM_RTMP")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    dest.platform === "CUSTOM_RTMP"
                      ? "bg-emerald-500/20 border-emerald-500/60 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-400" /> Custom RTMP
                </button>
              </div>

              {/* RTMP Server URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Server RTMP URL
                </label>
                <input
                  type="text"
                  disabled={isLiveStreaming || dest.platform !== "CUSTOM_RTMP"}
                  value={dest.rtmpUrl}
                  onChange={(e) => updateDestination(dest.id, "rtmpUrl", e.target.value)}
                  placeholder="rtmp://live.stream.example/app"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              {/* Stream Key */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stream Key
                </label>
                <input
                  type="password"
                  disabled={isLiveStreaming}
                  value={dest.streamKey}
                  onChange={(e) => updateDestination(dest.id, "streamKey", e.target.value)}
                  placeholder="Paste your live stream key..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60 font-mono"
                />
              </div>
            </div>
          ))}

          {/* Add Multi-Destination Button */}
          {!isLiveStreaming && (
            <button
              onClick={addDestination}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors bg-slate-800/30 hover:bg-slate-800/60"
            >
              <Plus className="w-4 h-4" /> Add Another Destination (Multi-Streaming)
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Parallel FFmpeg RTMP pipeline
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            {isLiveStreaming ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStop}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                <Square className="w-4 h-4 fill-white" />
                End Stream
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStart}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                Go Live
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
