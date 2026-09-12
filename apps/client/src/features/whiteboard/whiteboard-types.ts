export type WhiteboardTool =
  | "pen"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "sticky"
  | "text"
  | "eraser";

export interface WhiteboardElement {
  id: string;
  type: "path" | "rectangle" | "circle" | "line" | "arrow" | "sticky" | "text";
  data: any;
  color: string;
  strokeWidth: number;
  createdBy?: string;
  createdByName?: string;
}

export const WHITEBOARD_COLORS = [
  "#FFFFFF",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
];

export const WHITEBOARD_STROKE_WIDTHS = [2, 4, 8, 14];
