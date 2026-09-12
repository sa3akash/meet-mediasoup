"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { WhiteboardToolbar } from "./components/whiteboard-toolbar";
import { WhiteboardCanvas } from "./components/whiteboard-canvas";
import type { WhiteboardElement, WhiteboardTool } from "./whiteboard-types";

export * from "./whiteboard-types";

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (element: WhiteboardElement) => Promise<any>;
  onUpdateElement?: (elementId: string, updates: any) => Promise<any>;
  onClearBoard: () => Promise<any>;
  onFetchState: () => Promise<any>;
  remoteElements?: WhiteboardElement[];
}

export function WhiteboardModal({
  isOpen,
  onClose,
  onAddElement,
  onClearBoard,
  onFetchState,
  remoteElements = [],
}: WhiteboardModalProps) {
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [tool, setTool] = useState<WhiteboardTool>("pen");
  const [color, setColor] = useState("#FFFFFF");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);

  useEffect(() => {
    if (!isOpen) return;
    onFetchState().then((res) => { if (res?.elements) setElements(res.elements); }).catch(() => {});
  }, [isOpen, onFetchState]);

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

  if (!isOpen) return null;

  const handleAdd = (el: WhiteboardElement) => {
    setHistory((prev) => [...prev, elements]);
    setElements((prev) => [...prev, el]);
    onAddElement(el).catch(() => {});
  };

  const handleUndo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setElements(last);
  };

  const handleClear = () => {
    setHistory((prev) => [...prev, elements]);
    setElements([]);
    onClearBoard().catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[90vh] bg-neutral-900 border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
          <h2 className="text-base font-bold text-white">Collaborative Whiteboard</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <WhiteboardToolbar
          tool={tool} setTool={setTool} color={color} setColor={setColor}
          strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
          canUndo={history.length > 0} onUndo={handleUndo} onClear={handleClear}
          onExport={() => alert("Whiteboard exported.")}
        />

        <WhiteboardCanvas
          elements={elements} tool={tool} color={color} strokeWidth={strokeWidth}
          onAddElement={handleAdd} onRemoveElement={(id) => setElements((prev) => prev.filter((e) => e.id !== id))}
        />
      </div>
    </div>
  );
}
