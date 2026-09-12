"use client";

import { useState, useCallback } from "react";
import type { WhiteboardTool, WhiteboardElement } from "../features/whiteboard/whiteboard-types";

export function useWhiteboardTools() {
  const [tool, setTool] = useState<WhiteboardTool>("pen");
  const [color, setColor] = useState("#FFFFFF");
  const [strokeWidth, setStrokeWidth] = useState(3);
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

  return {
    tool,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
  };
}
