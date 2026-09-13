"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { WhiteboardToolbar } from "./components/whiteboard-toolbar";
import { WhiteboardCanvas } from "./components/whiteboard-canvas";
import { useWhiteboardTools } from "../../hooks/use-whiteboard-tools";
import { drawElement } from "./components/whiteboard-render";
import { moveElementBy } from "./components/whiteboard-hit-test";
import type { WhiteboardElement } from "./whiteboard-types";

export * from "./whiteboard-types";

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: WhiteboardElement) => Promise<any>;
  onUpdateElement?: (elementId: string, updates: any) => Promise<any>;
  onDeleteElement?: (elementId: string) => Promise<any>;
  onClearBoard: () => Promise<any>;
  onFetchState: () => Promise<any>;
  remoteElements?: WhiteboardElement[];
}

export function WhiteboardModal({
  isOpen,
  onClose,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onClearBoard,
  onFetchState,
  remoteElements = [],
}: WhiteboardModalProps) {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const tools = useWhiteboardTools();
  const {
    tool, setTool, color, setColor, fillColor, setFillColor,
    stickyColor, setStickyColor, strokeWidth, setStrokeWidth,
    selectedId, setSelectedId, scale, offset, setOffset,
    zoomIn, zoomOut, resetZoom, canUndo, canRedo, pushHistory, undo, redo,
  } = tools;

  useEffect(() => {
    if (!isOpen) return;
    onFetchState()
      .then((res) => {
        if (res?.elements) {
          setElements(res.elements);
          pushHistory(res.elements);
        }
      })
      .catch(() => {});
  }, [isOpen, onFetchState, pushHistory]);

  useEffect(() => {
    if (remoteElements?.length) {
      setElements((prev) => {
        const map = new Map<string, WhiteboardElement>();
        prev.forEach((el) => map.set(el.id, el));
        remoteElements.forEach((el) => map.set(el.id, el));
        return Array.from(map.values());
      });
    }
  }, [remoteElements]);

  const handleAdd = (el: WhiteboardElement) => {
    const next = [...elements, el];
    setElements(next);
    pushHistory(next);
    onAddElement(el).catch(() => {});
  };

  const handleUpdate = (id: string, updates: Partial<WhiteboardElement>) => {
    setElements((prev) => {
      const next = prev.map((el) => (el.id === id ? { ...el, ...updates, data: { ...el.data, ...(updates.data || {}) } } : el));
      pushHistory(next);
      return next;
    });
    onUpdateElement?.(id, updates).catch(() => {});
  };

  const handleRemove = (id: string) => {
    const next = elements.filter((e) => e.id !== id);
    setElements(next);
    pushHistory(next);
    if (selectedId === id) setSelectedId(null);
    onDeleteElement?.(id).catch(() => {});
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      handleRemove(selectedId);
    } else if (elements.length > 0) {
      const last = elements[elements.length - 1];
      if (last) handleRemove(last.id);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedId) {
      handleUpdate(selectedId, { color: newColor });
    }
  };

  const handleStrokeWidthChange = (w: number) => {
    setStrokeWidth(w);
    if (selectedId) {
      handleUpdate(selectedId, { strokeWidth: w });
    }
  };

  const handleToggleFill = () => {
    const nextFill = fillColor ? undefined : (color || "#3B82F6");
    setFillColor(nextFill);
    if (selectedId) {
      handleUpdate(selectedId, {
        fillColor: nextFill,
        data: { fillColor: nextFill },
      });
    }
  };

  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const target = elements.find((el) => el.id === selectedId);
    if (target) {
      const dup = moveElementBy(target, 20, 20);
      const newId = crypto.randomUUID();
      handleAdd({ ...dup, id: newId });
      setSelectedId(newId);
    }
  };

  const handleUndo = () => {
    const prev = undo();
    if (prev) setElements(prev);
  };

  const handleRedo = () => {
    const next = redo();
    if (next) setElements(next);
  };

  const handleClear = () => {
    pushHistory(elements);
    setElements([]);
    setSelectedId(null);
    onClearBoard().catch(() => {});
  };

  const handleExport = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    elements.forEach((el) => drawElement(ctx, el));

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = url;
    link.click();
  }, [elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      const targetTag = (e.target as HTMLElement).tagName;
      const isTyping = targetTag === "INPUT" || targetTag === "TEXTAREA";
      if (isTyping) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (selectedId && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const target = elements.find((el) => el.id === selectedId);
        if (target) {
          const moved = moveElementBy(target, dx, dy);
          handleUpdate(selectedId, { data: moved.data });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedId, elements, handleUndo, handleRedo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full ${isFullscreen ? "h-full rounded-none" : "max-w-7xl h-[92vh] rounded-3xl"} bg-neutral-900 border border-white/10 flex flex-col overflow-hidden shadow-2xl transition-all`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10 shrink-0 bg-neutral-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-white tracking-wide">Google Meet Whiteboard</h2>
            <span className="text-xs text-neutral-400">({elements.length} items)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <WhiteboardToolbar
          tool={tool} setTool={setTool} color={color} setColor={handleColorChange}
          fillColor={fillColor} onToggleFill={handleToggleFill}
          stickyColor={stickyColor} setStickyColor={setStickyColor}
          strokeWidth={strokeWidth} setStrokeWidth={handleStrokeWidthChange}
          selectedId={selectedId} onDeleteSelected={handleDeleteSelected}
          canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo}
          scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onResetZoom={resetZoom}
          onClear={handleClear} onExport={handleExport}
        />

        <WhiteboardCanvas
          elements={elements} tool={tool} color={color} fillColor={fillColor}
          strokeWidth={strokeWidth} stickyColor={stickyColor}
          selectedId={selectedId} setSelectedId={setSelectedId}
          scale={scale} offset={offset} setOffset={setOffset}
          onAddElement={handleAdd} onUpdateElement={handleUpdate} onRemoveElement={handleRemove}
        />
      </div>
    </div>
  );
}
