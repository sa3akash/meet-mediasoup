import React from "react";
import {
  Pencil,
  Square,
  Circle,
  Minus,
  ArrowRight,
  StickyNote,
  Type,
  Eraser,
  Undo2,
  Trash2,
  Download,
} from "lucide-react";
import {
  WHITEBOARD_COLORS,
  WHITEBOARD_STROKE_WIDTHS,
  type WhiteboardTool,
} from "../whiteboard-types";

interface WhiteboardToolbarProps {
  tool: WhiteboardTool;
  setTool: (tool: WhiteboardTool) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
  onExport: () => void;
}

const TOOLS: { id: WhiteboardTool; icon: React.ComponentType<{ className?: string }>; title: string }[] = [
  { id: "pen", icon: Pencil, title: "Freehand Pen" },
  { id: "rectangle", icon: Square, title: "Rectangle" },
  { id: "circle", icon: Circle, title: "Circle" },
  { id: "line", icon: Minus, title: "Line" },
  { id: "arrow", icon: ArrowRight, title: "Arrow" },
  { id: "sticky", icon: StickyNote, title: "Sticky Note" },
  { id: "text", icon: Type, title: "Text Label" },
  { id: "eraser", icon: Eraser, title: "Object Eraser" },
];

export function WhiteboardToolbar({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  canUndo,
  onUndo,
  onClear,
  onExport,
}: WhiteboardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-1 bg-neutral-800/70 p-1 rounded-xl border border-white/5">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-2 rounded-lg transition-colors ${
                active ? "bg-indigo-600 text-white shadow-md" : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
              title={t.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {WHITEBOARD_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`w-5 h-5 rounded-full border transition-transform ${
              color === c ? "scale-125 border-white shadow-md ring-2 ring-indigo-500/50" : "border-white/20 hover:scale-110"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-1 bg-neutral-800/70 p-1 rounded-xl border border-white/5">
        {WHITEBOARD_STROKE_WIDTHS.map((w) => (
          <button
            key={w}
            onClick={() => setStrokeWidth(w)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              strokeWidth === w ? "bg-white/20 text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            {w}px
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
          title="Clear Board"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
          title="Download PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
