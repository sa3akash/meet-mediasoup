"use client";

import { Globe, Trash2 } from "lucide-react";

export const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export interface StreamingDestinationForm {
  id: string;
  platform: "YOUTUBE" | "FACEBOOK" | "CUSTOM_RTMP";
  rtmpUrl: string;
  streamKey: string;
}

interface DestinationFormRowProps {
  dest: StreamingDestinationForm;
  index: number;
  totalCount: number;
  isLiveStreaming: boolean;
  onUpdate: (id: string, field: keyof StreamingDestinationForm, value: string) => void;
  onRemove: (id: string) => void;
}

export function DestinationFormRow({
  dest,
  index,
  totalCount,
  isLiveStreaming,
  onUpdate,
  onRemove,
}: DestinationFormRowProps) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-3">
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

        {totalCount > 1 && !isLiveStreaming && (
          <button
            onClick={() => onRemove(dest.id)}
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
          onClick={() => onUpdate(dest.id, "platform", "YOUTUBE")}
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
          onClick={() => onUpdate(dest.id, "platform", "FACEBOOK")}
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
          onClick={() => onUpdate(dest.id, "platform", "CUSTOM_RTMP")}
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
          onChange={(e) => onUpdate(dest.id, "rtmpUrl", e.target.value)}
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
          onChange={(e) => onUpdate(dest.id, "streamKey", e.target.value)}
          placeholder="Paste your live stream key..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60 font-mono"
        />
      </div>
    </div>
  );
}
