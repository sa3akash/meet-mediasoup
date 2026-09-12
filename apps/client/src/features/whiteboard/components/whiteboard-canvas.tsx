import React, { useRef, useEffect, useCallback, useState } from "react";
import type { WhiteboardElement, WhiteboardTool } from "../whiteboard-types";

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[];
  tool: WhiteboardTool;
  color: string;
  strokeWidth: number;
  onAddElement: (el: WhiteboardElement) => void;
  onRemoveElement: (id: string) => void;
}

export function WhiteboardCanvas({
  elements,
  tool,
  color,
  strokeWidth,
  onAddElement,
  onRemoveElement,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid background
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    elements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color; ctx.fillStyle = el.color; ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = "round"; ctx.lineJoin = "round";

      if (el.type === "path" && el.data.points?.length > 1) {
        ctx.beginPath(); ctx.moveTo(el.data.points[0].x, el.data.points[0].y);
        for (let i = 1; i < el.data.points.length; i++) ctx.lineTo(el.data.points[i].x, el.data.points[i].y);
        ctx.stroke();
      } else if (el.type === "rectangle") ctx.strokeRect(el.data.x, el.data.y, el.data.width, el.data.height);
      else if (el.type === "circle") {
        ctx.beginPath(); ctx.arc(el.data.x, el.data.y, Math.abs(el.data.radius), 0, Math.PI * 2); ctx.stroke();
      } else if (el.type === "line" || el.type === "arrow") {
        ctx.beginPath(); ctx.moveTo(el.data.x1, el.data.y1); ctx.lineTo(el.data.x2, el.data.y2); ctx.stroke();
      } else if (el.type === "sticky") {
        ctx.fillStyle = el.data.noteColor || "#FDE047"; ctx.fillRect(el.data.x, el.data.y, 140, 120);
        ctx.fillStyle = "#1e293b"; ctx.font = "bold 13px sans-serif"; ctx.fillText(el.data.text || "Sticky Note", el.data.x + 10, el.data.y + 24, 120);
      } else if (el.type === "text") {
        ctx.font = "bold 16px sans-serif"; ctx.fillText(el.data.text || "", el.data.x, el.data.y);
      }
      ctx.restore();
    });

    if (isDrawing && currentPath.length > 1 && tool === "pen") {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = strokeWidth; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) ctx.lineTo(currentPath[i].x, currentPath[i].y);
      ctx.stroke(); ctx.restore();
    }
  }, [elements, isDrawing, currentPath, tool, color, strokeWidth]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = getCoords(e);
    if (tool === "eraser") {
      const found = elements.find((el) => el.data?.x && Math.abs(el.data.x - p.x) < 25 && Math.abs(el.data.y - p.y) < 25);
      if (found) onRemoveElement(found.id);
      return;
    }
    if (tool === "text") { setTextInput({ x: p.x, y: p.y, value: "" }); return; }
    setIsDrawing(true); setStartPoint(p);
    if (tool === "pen") setCurrentPath([p]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getCoords(e);
    if (tool === "pen") setCurrentPath((prev) => [...prev, p]);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const p = getCoords(e);
    setIsDrawing(false);
    if (tool === "pen" && currentPath.length > 1) onAddElement({ id: crypto.randomUUID(), type: "path", data: { points: currentPath }, color, strokeWidth });
    else if (tool === "rectangle" && startPoint) onAddElement({ id: crypto.randomUUID(), type: "rectangle", data: { x: Math.min(startPoint.x, p.x), y: Math.min(startPoint.y, p.y), width: Math.abs(p.x - startPoint.x), height: Math.abs(p.y - startPoint.y) }, color, strokeWidth });
    else if (tool === "circle" && startPoint) onAddElement({ id: crypto.randomUUID(), type: "circle", data: { x: startPoint.x, y: startPoint.y, radius: Math.hypot(p.x - startPoint.x, p.y - startPoint.y) }, color, strokeWidth });
    else if (tool === "line" && startPoint) onAddElement({ id: crypto.randomUUID(), type: "line", data: { x1: startPoint.x, y1: startPoint.y, x2: p.x, y2: p.y }, color, strokeWidth });
    setCurrentPath([]); setStartPoint(null);
  };

  return (
    <div className="relative flex-1 w-full h-full bg-neutral-950 overflow-hidden">
      <canvas ref={canvasRef} width={1920} height={1080} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => setIsDrawing(false)} className="w-full h-full object-contain cursor-crosshair" />
      {textInput && (
        <input autoFocus type="text" value={textInput.value} onChange={(e) => setTextInput({ ...textInput, value: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && textInput.value.trim()) { onAddElement({ id: crypto.randomUUID(), type: "text", data: { x: textInput.x, y: textInput.y, text: textInput.value.trim() }, color, strokeWidth }); setTextInput(null); } }} onBlur={() => setTextInput(null)} style={{ left: textInput.x, top: textInput.y }} className="absolute z-20 px-2 py-1 bg-neutral-900 border border-indigo-500 rounded text-sm text-white" />
      )}
    </div>
  );
}
