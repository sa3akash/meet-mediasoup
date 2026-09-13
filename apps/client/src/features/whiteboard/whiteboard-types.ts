export type WhiteboardTool =
  | "select"
  | "pan"
  | "pen"
  | "highlighter"
  | "eraser"
  | "rectangle"
  | "circle"
  | "triangle"
  | "line"
  | "arrow"
  | "sticky"
  | "text"
  | "laser";

export interface WhiteboardElement {
  id: string;
  type: "path" | "rectangle" | "circle" | "triangle" | "line" | "arrow" | "sticky" | "text";
  data: any;
  color: string;
  strokeWidth: number;
  fillColor?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const WHITEBOARD_COLORS = [
  "#FFFFFF", // White
  "#EF4444", // Red
  "#F97316", // Orange
  "#FBBF24", // Yellow
  "#10B981", // Green
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate
];

export const STICKY_COLORS = [
  { name: "Yellow", value: "#FEF08A", text: "#713F12" },
  { name: "Green", value: "#BBF7D0", text: "#14532D" },
  { name: "Blue", value: "#BAE6FD", text: "#0C4A6E" },
  { name: "Pink", value: "#FBCFE8", text: "#831843" },
  { name: "Orange", value: "#FED7AA", text: "#7C2D12" },
];

export const WHITEBOARD_STROKE_WIDTHS = [2, 4, 8, 14];
