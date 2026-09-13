import React from "react";
import {
  MousePointer,
  Hand,
  Pencil,
  Highlighter,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  StickyNote,
  Type,
  Eraser,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  WHITEBOARD_COLORS,
  WHITEBOARD_STROKE_WIDTHS,
  STICKY_COLORS,
  type WhiteboardTool,
} from "../whiteboard-types";

interface WhiteboardToolbarProps {
  tool: WhiteboardTool;
  setTool: (tool: WhiteboardTool) => void;
  color: string;
  setColor: (color: string) => void;
  fillColor?: string;
  onToggleFill: () => void;
  stickyColor: { name: string; value: string; text: string };
  setStickyColor: (c: { name: string; value: string; text: string }) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  selectedId: string | null;
  onDeleteSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onClear: () => void;
  onExport: () => void;
}

const MAIN_TOOLS: { id: WhiteboardTool; icon: React.ComponentType<{ className?: string }>; title: string }[] = [
  { id: "select", icon: MousePointer, title: "Select & Move (V)" },
  { id: "pan", icon: Hand, title: "Pan Board (H)" },
  { id: "pen", icon: Pencil, title: "Pen (P)" },
  { id: "highlighter", icon: Highlighter, title: "Highlighter" },
  { id: "eraser", icon: Eraser, title: "Object Eraser (E)" },
  { id: "rectangle", icon: Square, title: "Rectangle (R)" },
  { id: "circle", icon: Circle, title: "Circle (C)" },
  { id: "triangle", icon: Triangle, title: "Triangle" },
  { id: "line", icon: Minus, title: "Line (L)" },
  { id: "arrow", icon: ArrowRight, title: "Arrow (A)" },
  { id: "sticky", icon: StickyNote, title: "Sticky Note (S)" },
  { id: "text", icon: Type, title: "Text Label (T)" },
  { id: "laser", icon: Sparkles, title: "Laser Pointer" },
];

export function WhiteboardToolbar(props: WhiteboardToolbarProps) {
  const {
    tool, setTool, color, setColor, fillColor, onToggleFill, stickyColor, setStickyColor,
    strokeWidth, setStrokeWidth, selectedId, onDeleteSelected, canUndo, canRedo, onUndo, onRedo,
    scale, onZoomIn, onZoomOut, onResetZoom, onClear, onExport,
  } = props;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-neutral-900 border-b border-white/10 shrink-0 text-sm">
      {/* Primary Tools */}
      <div className="flex items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-white/5 overflow-x-auto">
        {MAIN_TOOLS.map((t) => {
          const Icon = t.icon;
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-2 rounded-lg transition-all ${
                active ? "bg-indigo-600 text-white shadow-md scale-105" : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
              title={t.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Colors and Styles */}
      <div className="flex items-center gap-2">
        {tool === "sticky" ? (
          <div className="flex items-center gap-1.5 bg-neutral-800/60 p-1 rounded-xl border border-white/5">
            {STICKY_COLORS.map((sc) => (
              <button
                key={sc.value}
                onClick={() => setStickyColor(sc)}
                style={{ backgroundColor: sc.value }}
                className={`w-5 h-5 rounded-md border transition-transform ${
                  stickyColor.value === sc.value ? "scale-125 border-white ring-2 ring-indigo-500" : "border-black/20 hover:scale-110"
                }`}
                title={`${sc.name} Note`}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-neutral-800/60 p-1 rounded-xl border border-white/5">
            {WHITEBOARD_COLORS.slice(0, 7).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border transition-transform ${
                  color === c ? "scale-125 border-white ring-2 ring-indigo-500" : "border-white/20 hover:scale-110"
                }`}
              />
            ))}
          </div>
        )}

        {/* Widths & Fill */}
        <div className="hidden sm:flex items-center gap-1 bg-neutral-800/60 p-1 rounded-xl border border-white/5">
          {WHITEBOARD_STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                strokeWidth === w ? "bg-white/20 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              {w}px
            </button>
          ))}
          {(["rectangle", "circle", "triangle"].includes(tool) || selectedId) && (
            <button
              onClick={onToggleFill}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                fillColor
                  ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm"
                  : "border-white/10 text-neutral-400 hover:text-white"
              }`}
              title={fillColor ? "Fill enabled (click to disable)" : "Fill disabled (click to enable)"}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm border"
                style={{ backgroundColor: fillColor || "transparent", borderColor: fillColor ? "#818cf8" : "#71717a" }}
              />
              Fill: {fillColor ? "ON" : "OFF"}
            </button>
          )}
        </div>
      </div>

      {/* Undo, Redo, Zoom, Actions */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center bg-neutral-800/60 rounded-xl p-0.5 border border-white/5">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-lg text-neutral-300 hover:text-white disabled:opacity-30" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-lg text-neutral-300 hover:text-white disabled:opacity-30" title="Redo (Ctrl+Y)">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onDeleteSelected}
          className={`p-2 rounded-xl transition-all ${
            selectedId
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/40 shadow-sm cursor-pointer"
              : "bg-neutral-800/40 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
          }`}
          title={selectedId ? "Delete selected item (Delete / Backspace)" : "Delete latest item (or select an item to delete)"}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center bg-neutral-800/60 rounded-xl p-0.5 border border-white/5 text-xs text-neutral-300">
          <button onClick={onZoomOut} className="p-1.5 hover:text-white" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={onResetZoom} className="px-1 font-mono hover:text-white" title="Reset Zoom">
            {Math.round(scale * 100)}%
          </button>
          <button onClick={onZoomIn} className="p-1.5 hover:text-white" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <button onClick={onClear} className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-red-400" title="Clear Canvas">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onExport} className="p-2 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30" title="Export as PNG">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
