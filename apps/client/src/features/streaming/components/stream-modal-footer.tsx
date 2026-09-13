"use client";

import { CheckCircle2, Play, Square } from "lucide-react";

interface StreamModalFooterProps {
  isLiveStreaming: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onStart: () => void;
  onStop: () => void;
}

export function StreamModalFooter({
  isLiveStreaming,
  isSubmitting,
  onClose,
  onStart,
  onStop,
}: StreamModalFooterProps) {
  return (
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
            onClick={onStop}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
          >
            <Square className="w-4 h-4 fill-white" />
            End Stream
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onStart}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            Go Live
          </button>
        )}
      </div>
    </div>
  );
}
