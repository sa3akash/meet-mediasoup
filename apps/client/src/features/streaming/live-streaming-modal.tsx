"use client";

import React, { useState } from "react";
import { Radio, Plus, X, AlertCircle } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import {
  DestinationFormRow,
  StreamingDestinationForm,
} from "./components/destination-form-row";
import { StreamModalFooter } from "./components/stream-modal-footer";

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
  const { isLiveStreaming } = useMeetingStore();
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

        <div className="my-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {destinations.map((dest, index) => (
            <DestinationFormRow
              key={dest.id}
              dest={dest}
              index={index}
              totalCount={destinations.length}
              isLiveStreaming={isLiveStreaming}
              onUpdate={updateDestination}
              onRemove={removeDestination}
            />
          ))}

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

        <StreamModalFooter
          isLiveStreaming={isLiveStreaming}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onStart={handleStart}
          onStop={handleStop}
        />
      </div>
    </div>
  );
};
