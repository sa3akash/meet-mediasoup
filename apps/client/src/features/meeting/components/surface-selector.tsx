"use client";

import { Monitor, AppWindow, Globe } from "lucide-react";

export interface SurfaceItem {
  id: "monitor" | "window" | "browser";
  title: string;
  desc: string;
  icon: typeof Monitor;
}

export const SURFACES: SurfaceItem[] = [
  {
    id: "monitor",
    title: "Entire Screen",
    desc: "Share everything on your monitor, including alerts and notifications",
    icon: Monitor,
  },
  {
    id: "window",
    title: "Application Window",
    desc: "Share a single window (e.g. code editor, spreadsheet, or slides)",
    icon: AppWindow,
  },
  {
    id: "browser",
    title: "Browser Tab",
    desc: "Share a specific web tab. Ideal for smooth video and audio playback",
    icon: Globe,
  },
];

interface SurfaceSelectorProps {
  selectedSurface: "monitor" | "window" | "browser";
  onSelectSurface: (surface: "monitor" | "window" | "browser") => void;
}

export function SurfaceSelector({
  selectedSurface,
  onSelectSurface,
}: SurfaceSelectorProps) {
  return (
    <div className="space-y-3">
      {SURFACES.map((surface) => {
        const Icon = surface.icon;
        const isSelected = selectedSurface === surface.id;
        return (
          <div
            key={surface.id}
            onClick={() => onSelectSurface(surface.id)}
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
                  onChange={() => onSelectSurface(surface.id)}
                  className="w-4 h-4 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{surface.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
