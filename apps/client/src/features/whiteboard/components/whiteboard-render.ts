import type { WhiteboardElement } from "../whiteboard-types";
import { getElementBounds } from "./whiteboard-hit-test";

export interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

export function drawWhiteboardGrid(ctx: CanvasRenderingContext2D, width: number, height: number, scale: number, offset: { x: number; y: number }) {
  ctx.save();
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 0.5;
  const gridSize = 40 * scale;
  const startX = (offset.x * scale) % gridSize;
  const startY = (offset.y * scale) % gridSize;

  for (let x = startX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = startY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawElement(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
  ctx.save();
  const stroke = el.color || "#FFFFFF";
  const fill = el.fillColor || el.data?.fillColor;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill || stroke;
  ctx.lineWidth = el.strokeWidth || 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (el.data?.isHighlighter) {
    ctx.globalAlpha = 0.45;
  }

  switch (el.type) {
    case "path": {
      const points = el.data?.points || [];
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
      }
      break;
    }
    case "rectangle":
      if (fill && fill !== "none" && fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fillRect(el.data.x, el.data.y, el.data.width, el.data.height);
      }
      ctx.strokeRect(el.data.x, el.data.y, el.data.width, el.data.height);
      break;
    case "circle": {
      const r = Math.abs(el.data.radius || 10);
      ctx.beginPath();
      ctx.arc(el.data.x, el.data.y, r, 0, Math.PI * 2);
      if (fill && fill !== "none" && fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "triangle": {
      const { x, y, width = 60, height = 60 } = el.data;
      ctx.beginPath();
      ctx.moveTo(x + width / 2, y);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.closePath();
      if (fill && fill !== "none" && fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "line":
    case "arrow": {
      const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = el.data;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (el.type === "arrow") {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = Math.max(12, el.strokeWidth * 3);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();
      }
      break;
    }
    case "sticky": {
      const { x, y, width = 180, height = 160, text = "Sticky Note", noteColor = "#FEF08A", textColor = "#713F12" } = el.data;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = noteColor;
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, width, height, 10);
      } else {
        ctx.rect(x, y, width, height);
      }
      ctx.shadowColor = "transparent";

      ctx.fillStyle = textColor;
      ctx.font = "600 14px sans-serif";
      const lines = String(text).split("\n");
      lines.forEach((line, idx) => {
        if (idx < 7) ctx.fillText(line, x + 14, y + 28 + idx * 18, width - 28);
      });
      break;
    }
    case "text": {
      const fs = el.data.fontSize || 18;
      ctx.font = `600 ${fs}px sans-serif`;
      ctx.fillStyle = el.color;
      ctx.fillText(el.data.text || "", el.data.x, el.data.y);
      break;
    }
  }
  ctx.restore();
}

export function drawSelectionBox(ctx: CanvasRenderingContext2D, el: WhiteboardElement) {
  const b = getElementBounds(el);
  ctx.save();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(b.x, b.y, b.width, b.height);

  ctx.setLineDash([]);
  ctx.fillStyle = "#38bdf8";
  const hs = 7;
  const corners = [
    { x: b.x - hs / 2, y: b.y - hs / 2 },
    { x: b.x + b.width - hs / 2, y: b.y - hs / 2 },
    { x: b.x - hs / 2, y: b.y + b.height - hs / 2 },
    { x: b.x + b.width - hs / 2, y: b.y + b.height - hs / 2 },
  ];
  corners.forEach((c) => ctx.fillRect(c.x, c.y, hs, hs));
  ctx.restore();
}

export function drawLaserTrail(ctx: CanvasRenderingContext2D, trail: LaserPoint[]) {
  if (!trail.length) return;
  const now = Date.now();
  ctx.save();
  for (let i = 0; i < trail.length - 1; i++) {
    const age = now - trail[i].time;
    if (age > 1500) continue;
    const alpha = Math.max(0, 1 - age / 1500);
    ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.lineWidth = 6 * alpha;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(trail[i].x, trail[i].y);
    ctx.lineTo(trail[i + 1].x, trail[i + 1].y);
    ctx.stroke();
  }
  const last = trail[trail.length - 1];
  if (last && now - last.time < 1500) {
    ctx.fillStyle = "#EF4444";
    ctx.shadowColor = "#EF4444";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
