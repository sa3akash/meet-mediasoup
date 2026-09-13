"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { WhiteboardElement, WhiteboardTool } from "../whiteboard-types";
import { hitTestElement, moveElementBy } from "./whiteboard-hit-test";
import { drawWhiteboardGrid, drawElement, drawSelectionBox, drawLaserTrail, type LaserPoint } from "./whiteboard-render";

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[];
  tool: WhiteboardTool;
  color: string;
  fillColor?: string;
  strokeWidth: number;
  stickyColor: { name: string; value: string; text: string };
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  scale: number;
  offset: { x: number; y: number };
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onAddElement: (el: WhiteboardElement) => void;
  onUpdateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  onRemoveElement: (id: string) => void;
}

export function WhiteboardCanvas(props: WhiteboardCanvasProps) {
  const {
    elements, tool, color, fillColor, strokeWidth, stickyColor,
    selectedId, setSelectedId, scale, offset, setOffset,
    onAddElement, onUpdateElement, onRemoveElement,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cssSize, setCssSize] = useState({ width: 800, height: 600 });

  // Local elements state for 60fps drag without network lag
  const [localElements, setLocalElements] = useState<WhiteboardElement[]>(elements);
 
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);

   const activeElements = isDraggingElement ? localElements : elements;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  // Drawing state
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [shapeCurrent, setShapeCurrent] = useState<{ x: number; y: number } | null>(null);
  const [laserTrail, setLaserTrail] = useState<LaserPoint[]>([]);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number; text: string; isSticky?: boolean; editId?: string } | null>(null);
  const [isHoveringElement, setIsHoveringElement] = useState(false);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);

  // Sync canvas dimensions with parent container and handle high-DPI screens
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w > 20 && h > 20) {
        setCssSize({ width: w, height: h });
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Exact 1:1 CSS pixel to world coordinates conversion
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

    // Standardize client coordinates relative to the canvas CSS bounding box
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    return {
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale,
    };
  }, [offset, scale]);

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const w = cssSize.width;
    const h = cssSize.height;

    drawWhiteboardGrid(ctx, w, h, scale, offset);

    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    activeElements.forEach((el) => {
      drawElement(ctx, el);
      if (el.id === selectedId) drawSelectionBox(ctx, el);
    });

    if (isPointerDown) {
      if ((tool === "pen" || tool === "highlighter") && drawingPoints.length > 1) {
        drawElement(ctx, {
          id: "preview", type: "path", color, strokeWidth,
          data: { points: drawingPoints, isHighlighter: tool === "highlighter" },
        });
      } else if (shapeStart && shapeCurrent) {
        const x = Math.min(shapeStart.x, shapeCurrent.x);
        const y = Math.min(shapeStart.y, shapeCurrent.y);
        const sw = Math.abs(shapeCurrent.x - shapeStart.x);
        const sh = Math.abs(shapeCurrent.y - shapeStart.y);
        if (tool === "rectangle") {
          drawElement(ctx, { id: "preview", type: "rectangle", color, fillColor, strokeWidth, data: { x, y, width: sw, height: sh, fillColor } });
        } else if (tool === "circle") {
          const r = Math.hypot(shapeCurrent.x - shapeStart.x, shapeCurrent.y - shapeStart.y);
          drawElement(ctx, { id: "preview", type: "circle", color, fillColor, strokeWidth, data: { x: shapeStart.x, y: shapeStart.y, radius: r, fillColor } });
        } else if (tool === "triangle") {
          drawElement(ctx, { id: "preview", type: "triangle", color, fillColor, strokeWidth, data: { x, y, width: sw, height: sh, fillColor } });
        } else if (tool === "line" || tool === "arrow") {
          drawElement(ctx, { id: "preview", type: tool, color, strokeWidth, data: { x1: shapeStart.x, y1: shapeStart.y, x2: shapeCurrent.x, y2: shapeCurrent.y } });
        }
      }
    }

    if (laserTrail.length) drawLaserTrail(ctx, laserTrail);

    if (tool === "eraser" && cursorWorld) {
      ctx.save();
      ctx.strokeStyle = "#f43f5e";
      ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cursorWorld.x, cursorWorld.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [localElements, tool, color, fillColor, strokeWidth, selectedId, scale, offset, isPointerDown, drawingPoints, shapeStart, shapeCurrent, laserTrail, cssSize, cursorWorld, activeElements]);

  // Laser Fade animation
  useEffect(() => {
    if (!laserTrail.length) return;
    const anim = requestAnimationFrame(() => {
      const now = Date.now();
      const fresh = laserTrail.filter((p) => now - p.time < 1500);
      if (fresh.length !== laserTrail.length) setLaserTrail(fresh);
    });
    return () => cancelAnimationFrame(anim);
  }, [laserTrail]);

  const eraseAtPoint = useCallback((pt: { x: number; y: number }) => {
    const hit = [...localElements].reverse().find((el) => hitTestElement(el, pt, 24));
    if (hit) {
      setLocalElements((prev) => prev.filter((e) => e.id !== hit.id));
      onRemoveElement(hit.id);
      if (selectedId === hit.id) setSelectedId(null);
    }
  }, [localElements, onRemoveElement, selectedId, setSelectedId]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const w = screenToWorld(e.clientX, e.clientY);
    setIsPointerDown(true);
    setCursorWorld(w);

    if (tool === "select") {
      const hit = [...activeElements].reverse().find((el) => hitTestElement(el, w));
      if (hit) {
        setSelectedId(hit.id);
        setLocalElements(elements);
        setIsDraggingElement(true);
        dragStartRef.current = w;
        hasMovedRef.current = false;
      } else {
        setSelectedId(null);
      }
      return;
    }

    if (tool === "pan") {
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (tool === "laser") {
      setLaserTrail((prev) => [...prev, { x: w.x, y: w.y, time: Date.now() }]);
      return;
    }

    if (tool === "eraser") {
      eraseAtPoint(w);
      return;
    }

    if (tool === "sticky" || tool === "text") {
      setActiveTextInput({ x: w.x, y: w.y, text: "", isSticky: tool === "sticky" });
      return;
    }

    setShapeStart(w);
    setShapeCurrent(w);
    if (tool === "pen" || tool === "highlighter") setDrawingPoints([w]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const w = screenToWorld(e.clientX, e.clientY);
    setCursorWorld(w);

    if (tool === "eraser" && isPointerDown) {
      eraseAtPoint(w);
      return;
    }

    if (tool === "select") {
      const hovering = activeElements.some((el) => hitTestElement(el, w));
      setIsHoveringElement(hovering);
    }

    if (tool === "laser") {
      setLaserTrail((prev) => [...prev, { x: w.x, y: w.y, time: Date.now() }]);
    }

    if (!isPointerDown) return;

    if (tool === "select" && isDraggingElement && selectedId && dragStartRef.current) {
      const dx = w.x - dragStartRef.current.x;
      const dy = w.y - dragStartRef.current.y;
      if (dx !== 0 || dy !== 0) {
        hasMovedRef.current = true;
        setLocalElements((prev) =>
          prev.map((el) => (el.id === selectedId ? moveElementBy(el, dx, dy) : el))
        );
        dragStartRef.current = w;
      }
      return;
    }

    if (tool === "pan" && panStartRef.current) {
      setOffset((prev) => ({ x: prev.x + (e.clientX - panStartRef.current!.x), y: prev.y + (e.clientY - panStartRef.current!.y) }));
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (tool === "pen" || tool === "highlighter") {
      setDrawingPoints((pts) => [...pts, w]);
    } else if (shapeStart) {
      setShapeCurrent(w);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (!isPointerDown) return;
    const w = screenToWorld(e.clientX, e.clientY);
    setIsPointerDown(false);

    if (tool === "select") {
      if (isDraggingElement && selectedId && hasMovedRef.current) {
        const finalEl = localElements.find((el) => el.id === selectedId);
        if (finalEl) onUpdateElement(selectedId, { data: finalEl.data });
      }
      setIsDraggingElement(false);
      dragStartRef.current = null;
      hasMovedRef.current = false;
      return;
    }

    if (tool === "pan") {
      panStartRef.current = null;
      return;
    }

    if ((tool === "pen" || tool === "highlighter") && drawingPoints.length > 1) {
      onAddElement({
        id: crypto.randomUUID(), type: "path", color, strokeWidth,
        data: { points: drawingPoints, isHighlighter: tool === "highlighter" },
      });
    } else if (shapeStart && Math.hypot(w.x - shapeStart.x, w.y - shapeStart.y) > 4) {
      const id = crypto.randomUUID();
      const x = Math.min(shapeStart.x, w.x);
      const y = Math.min(shapeStart.y, w.y);
      const width = Math.abs(w.x - shapeStart.x);
      const height = Math.abs(w.y - shapeStart.y);

      if (tool === "rectangle") {
        onAddElement({ id, type: "rectangle", color, fillColor, strokeWidth, data: { x, y, width, height, fillColor } });
      } else if (tool === "circle") {
        const radius = Math.hypot(w.x - shapeStart.x, w.y - shapeStart.y);
        onAddElement({ id, type: "circle", color, fillColor, strokeWidth, data: { x: shapeStart.x, y: shapeStart.y, radius, fillColor } });
      } else if (tool === "triangle") {
        onAddElement({ id, type: "triangle", color, fillColor, strokeWidth, data: { x, y, width, height, fillColor } });
      } else if (tool === "line" || tool === "arrow") {
        onAddElement({ id, type: tool, color, strokeWidth, data: { x1: shapeStart.x, y1: shapeStart.y, x2: w.x, y2: w.y } });
      }
    }

    setDrawingPoints([]);
    setShapeStart(null);
    setShapeCurrent(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = screenToWorld(e.clientX, e.clientY);
    const hit = [...localElements].reverse().find((el) => hitTestElement(el, w));
    if (hit && (hit.type === "sticky" || hit.type === "text")) {
      setActiveTextInput({
        x: hit.data.x,
        y: hit.data.y,
        text: hit.data.text || "",
        isSticky: hit.type === "sticky",
        editId: hit.id,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full bg-neutral-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        style={{ width: `${cssSize.width}px`, height: `${cssSize.height}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onPointerLeave={() => { setIsPointerDown(false); setIsDraggingElement(false); setCursorWorld(null); }}
        className={`block touch-none ${
          tool === "select" ? (isDraggingElement ? "cursor-grabbing" : isHoveringElement ? "cursor-move" : "cursor-default") : tool === "pan" ? "cursor-grab" : "cursor-crosshair"
        }`}
      />

      {activeTextInput && (
        <div
          style={{ left: activeTextInput.x * scale + offset.x, top: activeTextInput.y * scale + offset.y }}
          className="absolute z-30 p-1"
        >
          {activeTextInput.isSticky ? (
            <textarea
              autoFocus
              placeholder="Type sticky note..."
              defaultValue={activeTextInput.text}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    if (activeTextInput.editId) {
                      onUpdateElement(activeTextInput.editId, { data: { text: val } });
                    } else {
                      onAddElement({
                        id: crypto.randomUUID(), type: "sticky", color: stickyColor.text, strokeWidth: 1,
                        data: { x: activeTextInput.x, y: activeTextInput.y, text: val, noteColor: stickyColor.value, textColor: stickyColor.text },
                      });
                    }
                  }
                  setActiveTextInput(null);
                } else if (e.key === "Escape") setActiveTextInput(null);
              }}
              style={{ backgroundColor: stickyColor.value, color: stickyColor.text }}
              className="w-52 h-44 p-3 rounded-2xl shadow-2xl font-semibold text-sm resize-none outline-none border border-black/10 ring-2 ring-black/20"
            />
          ) : (
            <input
              autoFocus
              type="text"
              placeholder="Type label..."
              defaultValue={activeTextInput.text}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    if (activeTextInput.editId) {
                      onUpdateElement(activeTextInput.editId, { data: { text: val } });
                    } else {
                      onAddElement({
                        id: crypto.randomUUID(), type: "text", color, strokeWidth,
                        data: { x: activeTextInput.x, y: activeTextInput.y, text: val, fontSize: strokeWidth * 5 + 12 },
                      });
                    }
                  }
                  setActiveTextInput(null);
                } else if (e.key === "Escape") setActiveTextInput(null);
              }}
              className="px-3 py-1.5 bg-neutral-900 border-2 border-indigo-500 rounded-xl text-white font-bold text-sm outline-none shadow-2xl"
            />
          )}
        </div>
      )}
    </div>
  );
}
