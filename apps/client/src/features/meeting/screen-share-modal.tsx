"use client";

import { useState } from "react";
import { X, Monitor, AppWindow, Globe, Volume2, ArrowRight } from "lucide-react";
import type { ScreenShareOptions } from "../../hooks/use-mediasoup";

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartShare: (options: ScreenShareOptions) => Promise<void>;
}

export function ScreenShareModal({
  isOpen,
  onClose,
  onStartShare,
}: ScreenShareModalProps) {
  const [selectedSurface, setSelectedSurface] = useState<"monitor" | "window" | "browser">("monitor");
  const [shareAudio, setShareAudio] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      setIsStarting(true);
      await onStartShare({
        displaySurface: selectedSurface,
        systemAudio: shareAudio,
      });
      onClose();
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    } finally {
      setIsStarting(false);
    }
  };

  const surfaces = [
    {
      id: "monitor" as const,
      title: "Entire Screen",
      desc: "Share everything on your monitor, including alerts and notifications",
      icon: Monitor,
    },
    {
      id: "window" as const,
      title: "Application Window",
      desc: "Share a single window (e.g. code editor, spreadsheet, or slides)",
      icon: AppWindow,
    },
    {
      id: "browser" as const,
      title: "Browser Tab",
      desc: "Share a specific web tab. Ideal for smooth video and audio playback",
      icon: Globe,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-base">Share your screen</h3>
            <p className="text-white/40 text-xs">Choose what you want to present to the meeting</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Surface Selection */}
        <div className="p-5 space-y-3">
          {surfaces.map((surface) => {
            const Icon = surface.icon;
            const isSelected = selectedSurface === surface.id;
            return (
              <div
                key={surface.id}
                onClick={() => setSelectedSurface(surface.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? "bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                    : "bg-neutral-800/40 border-white/5 hover:bg-neutral-800/80 hover:border-white/15"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? "bg-indigo-600 text-white shadow-md" : "bg-neutral-800 text-white/60"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{surface.title}</span>
                    <input
                      type="radio"
                      name="displaySurface"
                      checked={isSelected}
                      onChange={() => setSelectedSurface(surface.id)}
                      className="w-4 h-4 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{surface.desc}</p>
                </div>
              </div>
            );
          })}

          {/* System Audio Toggle */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/30 border border-white/5 cursor-pointer hover:bg-neutral-800/60 transition-colors">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Share system audio</span>
                  <span className="text-[11px] text-white/40 block">Include computer sound / tab audio</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shareAudio}
                onChange={(e) => setShareAudio(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-neutral-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isStarting}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-98"
          >
            <span>{isStarting ? "Starting..." : "Start Sharing"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
