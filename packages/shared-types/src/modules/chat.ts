import type { MessageType } from "./enums";

export interface ChatReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ChatMessageDTO {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  recipientId?: string | null;
  replyToId?: string | null;
  content: string;
  messageType: MessageType;
  reactions: Record<string, ChatReaction>;
  isPinned: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface PollDTO {
  id: string;
  meetingId: string;
  createdBy: string;
  question: string;
  options: PollOption[];
  isAnonymous: boolean;
  isActive: boolean;
  totalVotes: number;
  userVotedOptionId?: string | null;
  createdAt: string;
  closedAt?: string | null;
}

export type WhiteboardTool = "select" | "draw" | "rectangle" | "circle" | "text" | "sticky" | "eraser";

export interface WhiteboardElement {
  id: string;
  type: WhiteboardTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  createdBy: string;
  updatedAt: number;
}
