"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutGrid,
  User,
  Sparkles,
  Columns2,
  Tv,
  Check,
  ChevronUp,
} from "lucide-react";
import { useMeetingStore, type VideoLayout } from "../../stores/meeting-store";

export function LayoutSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { layoutMode, setLayoutMode } = useMeetingStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const layouts: Array<{
    id: VideoLayout;
    label: string;
    description: string;
    icon: any;
  }> = [
    {
      id: "GRID",
      label: "Grid View",
      description: "Equal-sized dynamic grid of all participants",
      icon: LayoutGrid,
    },
    {
      id: "SPEAKER",
      label: "Speaker View",
      description: "Auto-focus on whoever is actively speaking",
      icon: User,
    },
    {
      id: "SPOTLIGHT",
      label: "Spotlight View",
      description: "Center stage on spotlighted or pinned user",
      icon: Sparkles,
    },
    {
      id: "SIDEBAR",
      label: "Sidebar View",
      description: "Large stage with vertical filmstrip on right",
      icon: Columns2,
    },
    {
      id: "PRESENTATION",
      label: "Presentation View",
      description: "Maximized theater mode for slides and screen",
      icon: Tv,
    },
  ];

  const currentLayout = layouts.find((l) => l.id === layoutMode) || layouts[0];
  const CurrentIcon = currentLayout.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-xl transition-colors relative flex items-center gap-1.5 ${
          isOpen ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
        title="Change Layout"
      >
        <CurrentIcon className="w-5 h-5" />
        <ChevronUp
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-neutral-900 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 animate-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-white/5 mb-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Change Layout
            </span>
          </div>

          <div className="space-y-1">
            {layouts.map((l) => {
              const Icon = l.icon;
              const isSelected = layoutMode === l.id;

              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setLayoutMode(l.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-start gap-3 text-left transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 text-white border border-indigo-500/30"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? "bg-indigo-600 text-white" : "bg-neutral-800 text-white/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{l.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-snug line-clamp-1">
                      {l.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
