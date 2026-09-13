"use client";

import { useState, useCallback } from "react";
import type { WhiteboardTool, WhiteboardElement } from "../features/whiteboard/whiteboard-types";
import { STICKY_COLORS } from "../features/whiteboard/whiteboard-types";

export function useWhiteboardTools() {
  const [tool, setTool] = useState<WhiteboardTool>("select");
  const [color, setColor] = useState("#FFFFFF");
  const [fillColor, setFillColor] = useState<string | undefined>(undefined);
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Viewport Zoom & Pan
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomIn = useCallback(() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1))), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(0.4, +(s - 0.2).toFixed(1))), []);
  const resetZoom = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, []);

  // History for Undo / Redo
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((elements: WhiteboardElement[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, elements];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
      return history[historyIndex - 1];
    }
    return null;
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
      return history[historyIndex + 1];
    }
    return null;
  }, [canRedo, history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    tool,
    setTool,
    color,
    setColor,
    fillColor,
    setFillColor,
    stickyColor,
    setStickyColor,
    strokeWidth,
    setStrokeWidth,
    selectedId,
    setSelectedId,
    scale,
    setScale,
    offset,
    setOffset,
    zoomIn,
    zoomOut,
    resetZoom,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    clearHistory,
  };
}
