import { redis } from "../../infrastructure/redis";

export interface ChatAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface ChatReplyTo {
  id: string;
  senderName: string;
  content: string;
}

export interface ChatLinkPreview {
  url: string;
  title: string;
  domain: string;
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: "TEXT" | "FILE" | "SYSTEM";
  attachment?: ChatAttachment;
  replyTo?: ChatReplyTo;
  mentions?: string[];
  linkPreview?: ChatLinkPreview;
  reactions: Record<string, string[]>; // emoji -> array of participant names/IDs
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
}

// In-Memory store for fast local lookup and fallback
const chatMemoryStore = new Map<string, ChatMessage[]>();
const mutedUsersStore = new Map<string, Set<string>>(); // meetingId -> Set of muted participantIds

export class ChatService {
  private getRedisKey(meetingId: string): string {
    return `meeting:${meetingId}:chat_messages`;
  }

  // Extract link preview from text if URL is found
  public extractLinkPreview(content: string): ChatLinkPreview | undefined {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);
    if (!matches || matches.length === 0) return undefined;
    const url = matches[0];
    try {
      const parsed = new URL(url);
      return {
        url,
        title: parsed.hostname,
        domain: parsed.hostname.replace(/^www\./, ""),
      };
    } catch {
      return undefined;
    }
  }

  // Extract @mentions from text (@Name or @all)
  public extractMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_\-.]+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(1))));
  }

  public async saveMessage(meetingId: string, message: ChatMessage): Promise<ChatMessage> {
    // 1. Memory Store
    let list = chatMemoryStore.get(meetingId);
    if (!list) {
      list = [];
      chatMemoryStore.set(meetingId, list);
    }
    list.push(message);

    // 2. Redis Store
    try {
      await redis.rpush(this.getRedisKey(meetingId), JSON.stringify(message));
      await redis.expire(this.getRedisKey(meetingId), 86400 * 3); // 3 days retention
    } catch {
      // Memory fallback active
    }

    return message;
  }

  public async getHistory(meetingId: string): Promise<ChatMessage[]> {
    try {
      const items = await redis.lrange(this.getRedisKey(meetingId), 0, -1);
      if (items && items.length > 0) {
        return items.map((raw) => JSON.parse(raw));
      }
    } catch {
      // fallback to memory
    }
    return chatMemoryStore.get(meetingId) || [];
  }

  public async addReaction(
    meetingId: string,
    messageId: string,
    participantId: string,
    emoji: string
  ): Promise<{ messageId: string; reactions: Record<string, string[]> } | null> {
    const messages = await this.getHistory(meetingId);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions) msg.reactions = {};
    const existing = msg.reactions[emoji] || [];

    // Toggle reaction
    const idx = existing.indexOf(participantId);
    if (idx !== -1) {
      existing.splice(idx, 1);
      if (existing.length === 0) {
        delete msg.reactions[emoji];
      } else {
        msg.reactions[emoji] = existing;
      }
    } else {
      msg.reactions[emoji] = [...existing, participantId];
    }

    // Persist updated message list
    await this.updateMeetingMessages(meetingId, messages);
    return { messageId, reactions: msg.reactions };
  }

  public async deleteMessage(meetingId: string, messageId: string): Promise<boolean> {
    const messages = await this.getHistory(meetingId);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return false;

    msg.isDeleted = true;
    msg.content = "This message was deleted.";
    delete msg.attachment;

    await this.updateMeetingMessages(meetingId, messages);
    return true;
  }

  public async pinMessage(meetingId: string, messageId: string, isPinned: boolean): Promise<ChatMessage | null> {
    const messages = await this.getHistory(meetingId);
    let target: ChatMessage | null = null;

    for (const m of messages) {
      if (m.id === messageId) {
        m.isPinned = isPinned;
        target = m;
      } else if (isPinned) {
        // Only one pinned message at a time
        m.isPinned = false;
      }
    }

    if (target) {
      await this.updateMeetingMessages(meetingId, messages);
    }
    return target;
  }

  public async muteUser(meetingId: string, participantId: string, muted: boolean): Promise<void> {
    let set = mutedUsersStore.get(meetingId);
    if (!set) {
      set = new Set();
      mutedUsersStore.set(meetingId, set);
    }
    if (muted) set.add(participantId);
    else set.delete(participantId);
  }

  public isUserMuted(meetingId: string, participantId: string): boolean {
    const set = mutedUsersStore.get(meetingId);
    return Boolean(set && set.has(participantId));
  }

  public async searchMessages(meetingId: string, query: string): Promise<ChatMessage[]> {
    const messages = await this.getHistory(meetingId);
    const q = query.toLowerCase().trim();
    if (!q) return messages;

    return messages.filter(
      (m) =>
        !m.isDeleted &&
        (m.content.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          (m.attachment && m.attachment.name.toLowerCase().includes(q)))
    );
  }

  public async exportChat(meetingId: string, format: "txt" | "json" = "txt"): Promise<string> {
    const messages = await this.getHistory(meetingId);

    if (format === "json") {
      return JSON.stringify(messages, null, 2);
    }

    const lines: string[] = [
      `==================================================`,
      `MEETING CHAT TRANSCRIPT`,
      `Meeting ID: ${meetingId}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Total Messages: ${messages.length}`,
      `==================================================\n`,
    ];

    for (const m of messages) {
      const time = new Date(m.createdAt).toLocaleTimeString();
      if (m.isDeleted) {
        lines.push(`[${time}] ${m.senderName}: [Message Deleted]`);
      } else {
        let line = `[${time}] ${m.senderName}: ${m.content}`;
        if (m.replyTo) {
          line += ` (In reply to ${m.replyTo.senderName}: "${m.replyTo.content.slice(0, 30)}...")`;
        }
        if (m.attachment) {
          line += ` [Attachment: ${m.attachment.name} (${m.attachment.type})]`;
        }
        lines.push(line);
      }
    }

    return lines.join("\n");
  }

  private async updateMeetingMessages(meetingId: string, messages: ChatMessage[]): Promise<void> {
    chatMemoryStore.set(meetingId, messages);
    try {
      await redis.del(this.getRedisKey(meetingId));
      if (messages.length > 0) {
        const pipeline = redis.pipeline();
        for (const m of messages) {
          pipeline.rpush(this.getRedisKey(meetingId), JSON.stringify(m));
        }
        pipeline.expire(this.getRedisKey(meetingId), 86400 * 3);
        await pipeline.exec();
      }
    } catch {
      // Memory store updated
    }
  }
}

export const chatService = new ChatService();
