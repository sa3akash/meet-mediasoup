export interface MessageAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface MessageReplyTo {
  id: string;
  senderName: string;
  content: string;
}

export interface MessageLinkPreview {
  url: string;
  title: string;
  domain: string;
}

export interface Message {
  id: string;
  meetingId?: string;
  senderId?: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
  messageType?: "TEXT" | "FILE" | "SYSTEM";
  attachment?: MessageAttachment;
  replyTo?: MessageReplyTo;
  mentions?: string[];
  linkPreview?: MessageLinkPreview;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  isDeleted?: boolean;
}
