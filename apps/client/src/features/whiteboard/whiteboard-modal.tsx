"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Square,
  Circle,
  Minus,
  ArrowRight,
  StickyNote,
  Type,
  Eraser,
  Trash2,
  Download,
  X,
  Undo2,
  Palette,
} from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";

export interface WhiteboardElement {
  id: string;
  type: "path" | "rectangle" | "circle" | "line" | "arrow" | "sticky" | "text";
  data: any;
  color: string;
  strokeWidth: number;
  createdBy?: string;
  createdByName?: string;
}

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: WhiteboardElement) => Promise<any>;
  onUpdateElement: (elementId: string, updates: any) => Promise<any>;
  onClearBoard: () => Promise<any>;
  onFetchState: () => Promise<any>;
  remoteElements?: WhiteboardElement[];
}

const COLORS = [
  "#FFFFFF",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
];

const STROKE_WIDTHS = [2, 4, 8, 14];

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  onAddElement,
  onClearBoard,
  onFetchState,
  remoteElements = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [tool, setTool] = useState<
    "pen" | "rectangle" | "circle" | "line" | "arrow" | "sticky" | "text" | "eraser"
  >("pen");
  const [color, setColor] = useState("#FFFFFF");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);

  // Sync state on open
  useEffect(() => {
    if (!isOpen) return;
    onFetchState()
      .then((res) => {
        if (res?.elements && Array.isArray(res.elements)) {
          setElements(res.elements);
        }
      })
      .catch(() => {});
  }, [isOpen, onFetchState]);

  // Sync incoming remote elements
  useEffect(() => {
    if (remoteElements && remoteElements.length > 0) {
      setElements((prev) => {
        const map = new Map<string, WhiteboardElement>();
        prev.forEach((el) => map.set(el.id, el));
        remoteElements.forEach((el) => map.set(el.id, el));
        return Array.from(map.values());
      });
    }
  }, [remoteElements]);

  // Canvas redraw logic
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render elements
    elements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "path" && Array.isArray(el.data.points) && el.data.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.data.points[0].x, el.data.points[0].y);
        for (let i = 1; i < el.data.points.length; i++) {
          ctx.lineTo(el.data.points[i].x, el.data.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === "rectangle") {
        const { x, y, width, height } = el.data;
        ctx.strokeRect(x, y, width, height);
      } else if (el.type === "circle") {
        const { x, y, radius } = el.data;
        ctx.beginPath();
        ctx.arc(x, y, Math.abs(radius), 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === "line" || el.type === "arrow") {
        const { x1, y1, x2, y2 } = el.data;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (el.type === "arrow") {
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headlen = 12;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - headlen * Math.cos(angle - Math.PI / 6),
            y2 - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - headlen * Math.cos(angle + Math.PI / 6),
            y2 - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      } else if (el.type === "sticky") {
        const { x, y, text, noteColor = "#FDE047" } = el.data;
        ctx.fillStyle = noteColor;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, 160, 140);
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.fillText(text || "Sticky Note", x + 12, y + 26, 136);
      } else if (el.type === "text") {
        const { x, y, text } = el.data;
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.fillText(text || "", x, y);
      }

      ctx.restore();
    });

    // Render live current path if drawing
    if (isDrawing && currentPath.length > 1 && tool === "pen") {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [elements, isDrawing, currentPath, tool, color, strokeWidth]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(pt);

    if (tool === "pen") {
      setCurrentPath([pt]);
    } else if (tool === "sticky") {
      const noteText = prompt("Enter text for sticky note:", "Idea note");
      if (noteText) {
        const newEl: WhiteboardElement = {
          id: crypto.randomUUID(),
          type: "sticky",
          data: { x: pt.x, y: pt.y, text: noteText, noteColor: color },
          color,
          strokeWidth: 1,
        };
        setElements((prev) => [...prev, newEl]);
        onAddElement(newEl);
      }
      setIsDrawing(false);
    } else if (tool === "text") {
      setTextInput({ x: pt.x, y: pt.y, value: "" });
      setIsDrawing(false);
    } else if (tool === "eraser") {
      // Find element nearby and remove
      setElements((prev) =>
        prev.filter((el) => {
          if (el.type === "path") {
            return !el.data.points?.some(
              (p: any) => Math.hypot(p.x - pt.x, p.y - pt.y) < 15
            );
          }
          return true;
        })
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasCoords(e);

    if (tool === "pen") {
      setCurrentPath((prev) => [...prev, pt]);
    } else if (tool === "eraser") {
      setElements((prev) =>
        prev.filter((el) => {
          if (el.type === "path") {
            return !el.data.points?.some(
              (p: any) => Math.hypot(p.x - pt.x, p.y - pt.y) < 20
            );
          }
          return true;
        })
      );
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const endPt = getCanvasCoords(e);

    if (tool === "pen" && currentPath.length > 1) {
      const newEl: WhiteboardElement = {
        id: crypto.randomUUID(),
        type: "path",
        data: { points: currentPath },
        color,
        strokeWidth,
      };
      setElements((prev) => [...prev, newEl]);
      onAddElement(newEl);
      setCurrentPath([]);
    } else if (tool === "rectangle" && startPoint) {
      const newEl: WhiteboardElement = {
        id: crypto.randomUUID(),
        type: "rectangle",
        data: {
          x: Math.min(startPoint.x, endPt.x),
          y: Math.min(startPoint.y, endPt.y),
          width: Math.abs(endPt.x - startPoint.x),
          height: Math.abs(endPt.y - startPoint.y),
        },
        color,
        strokeWidth,
      };
      setElements((prev) => [...prev, newEl]);
      onAddElement(newEl);
    } else if (tool === "circle" && startPoint) {
      const radius = Math.hypot(endPt.x - startPoint.x, endPt.y - startPoint.y);
      const newEl: WhiteboardElement = {
        id: crypto.randomUUID(),
        type: "circle",
        data: { x: startPoint.x, y: startPoint.y, radius },
        color,
        strokeWidth,
      };
      setElements((prev) => [...prev, newEl]);
      onAddElement(newEl);
    } else if ((tool === "line" || tool === "arrow") && startPoint) {
      const newEl: WhiteboardElement = {
        id: crypto.randomUUID(),
        type: tool,
        data: { x1: startPoint.x, y1: startPoint.y, x2: endPt.x, y2: endPt.y },
        color,
        strokeWidth,
      };
      setElements((prev) => [...prev, newEl]);
      onAddElement(newEl);
    }

    setStartPoint(null);
  };

  const handleTextSubmit = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    const newEl: WhiteboardElement = {
      id: crypto.randomUUID(),
      type: "text",
      data: { x: textInput.x, y: textInput.y, text: textInput.value },
      color,
      strokeWidth,
    };
    setElements((prev) => [...prev, newEl]);
    onAddElement(newEl);
    setTextInput(null);
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear the whiteboard for all participants?")) {
      setElements([]);
      await onClearBoard();
    }
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `meeting-whiteboard-${Date.now()}.png`;
    link.href = url;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl h-[88vh] rounded-2xl bg-slate-900 border border-slate-700/60 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Collaborative Whiteboard</h3>
              <p className="text-xs text-slate-400">Real-time vector sync across all participants</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export PNG
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-medium text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Canvas Container */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden">
          {/* Floating Left Toolbar */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl">
            <button
              title="Pen / Brush"
              onClick={() => setTool("pen")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "pen"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              title="Rectangle"
              onClick={() => setTool("rectangle")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "rectangle"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              title="Circle"
              onClick={() => setTool("circle")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "circle"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Circle className="w-4 h-4" />
            </button>

            <button
              title="Line"
              onClick={() => setTool("line")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "line"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              title="Arrow"
              onClick={() => setTool("arrow")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "arrow"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              title="Sticky Note"
              onClick={() => setTool("sticky")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "sticky"
                  ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <StickyNote className="w-4 h-4" />
            </button>

            <button
              title="Text Label"
              onClick={() => setTool("text")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "text"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Type className="w-4 h-4" />
            </button>

            <button
              title="Eraser"
              onClick={() => setTool("eraser")}
              className={`p-2.5 rounded-xl transition-all ${
                tool === "eraser"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>

            <div className="w-full h-px bg-slate-800 my-1" />

            {/* Color Palette dropdown / list */}
            <div className="flex flex-col gap-1.5 p-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color === c ? "scale-125 border-white ring-2 ring-indigo-500" : "border-slate-700"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Stroke Width Selector */}
            <div className="w-full h-px bg-slate-800 my-1" />
            <div className="flex flex-col gap-1.5 items-center p-1">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw}
                  onClick={() => setStrokeWidth(sw)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    strokeWidth === sw ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{ width: sw + 2, height: sw + 2 }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Active Canvas */}
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full cursor-crosshair block"
          />

          {/* Text input prompt if active */}
          {textInput && (
            <div
              className="absolute z-20 flex gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl"
              style={{
                left: `${(textInput.x / 1600) * 100}%`,
                top: `${(textInput.y / 900) * 100}%`,
              }}
            >
              <input
                autoFocus
                type="text"
                value={textInput.value}
                onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTextSubmit();
                  else if (e.key === "Escape") setTextInput(null);
                }}
                placeholder="Type text and press Enter..."
                className="px-3 py-1.5 text-sm rounded bg-slate-800 border border-slate-600 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleTextSubmit}
                className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
