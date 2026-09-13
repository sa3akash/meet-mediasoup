import type { WhiteboardElement } from "../whiteboard-types";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getElementBounds(el: WhiteboardElement): Bounds {
  switch (el.type) {
    case "path": {
      const points = el.data?.points || [];
      if (!points.length) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
      for (const p of points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      return { x: minX - 4, y: minY - 4, width: Math.max(maxX - minX + 8, 12), height: Math.max(maxY - minY + 8, 12) };
    }
    case "rectangle":
      return { x: el.data.x, y: el.data.y, width: el.data.width || 10, height: el.data.height || 10 };
    case "circle": {
      const r = Math.abs(el.data.radius || 10);
      return { x: el.data.x - r, y: el.data.y - r, width: r * 2, height: r * 2 };
    }
    case "triangle": {
      const { x, y, width = 60, height = 60 } = el.data;
      return { x, y, width, height };
    }
    case "line":
    case "arrow": {
      const { x1 = 0, y1 = 0, x2 = 0, y2 = 0 } = el.data;
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      return { x: minX - 6, y: minY - 6, width: Math.max(Math.abs(x2 - x1) + 12, 12), height: Math.max(Math.abs(y2 - y1) + 12, 12) };
    }
    case "sticky":
      return { x: el.data.x, y: el.data.y, width: el.data.width || 180, height: el.data.height || 160 };
    case "text": {
      const fs = el.data.fontSize || 18;
      const textLen = (el.data.text || "").length || 1;
      return { x: el.data.x - 4, y: el.data.y - fs, width: Math.max(textLen * 11, 40), height: fs * 1.5 };
    }
    default:
      return { x: el.data?.x || 0, y: el.data?.y || 0, width: 50, height: 50 };
  }
}

export function hitTestElement(el: WhiteboardElement, p: { x: number; y: number }, pad: number = 10): boolean {
  const b = getElementBounds(el);
  if (p.x < b.x - pad || p.x > b.x + b.width + pad || p.y < b.y - pad || p.y > b.y + b.height + pad) {
    return false;
  }

  if (el.type === "path" && Array.isArray(el.data?.points) && el.data.points.length > 0) {
    const r = Math.max(pad, (el.strokeWidth || 4) + 8);
    return el.data.points.some((pt: { x: number; y: number }) => Math.hypot(pt.x - p.x, pt.y - p.y) <= r);
  }

  return true;
}

export function moveElementBy(el: WhiteboardElement, dx: number, dy: number): WhiteboardElement {
  const data = { ...el.data };
  switch (el.type) {
    case "path":
      if (Array.isArray(data.points)) {
        data.points = data.points.map((pt: { x: number; y: number }) => ({ x: pt.x + dx, y: pt.y + dy }));
      }
      break;
    case "rectangle":
    case "circle":
    case "sticky":
    case "text":
    case "triangle":
      data.x = (data.x || 0) + dx;
      data.y = (data.y || 0) + dy;
      break;
    case "line":
    case "arrow":
      data.x1 = (data.x1 || 0) + dx;
      data.y1 = (data.y1 || 0) + dy;
      data.x2 = (data.x2 || 0) + dx;
      data.y2 = (data.y2 || 0) + dy;
      break;
  }
  return { ...el, data, updatedAt: new Date().toISOString() };
}
