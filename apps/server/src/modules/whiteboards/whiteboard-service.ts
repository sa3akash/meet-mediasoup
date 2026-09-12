import { redis } from "../../infrastructure/redis";

export interface WhiteboardElement {
  id: string;
  type: "path" | "shape" | "sticky" | "text";
  data: any; // points for path, dimensions & shapeType for shape, text & color for sticky
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

const whiteboardMemory = new Map<string, Map<string, WhiteboardElement>>(); // meetingId -> elementId -> Element

export class WhiteboardService {
  private getRedisKey(meetingId: string): string {
    return `meeting:${meetingId}:whiteboard_elements`;
  }

  public async addObject(meetingId: string, element: WhiteboardElement): Promise<WhiteboardElement> {
    let board = whiteboardMemory.get(meetingId);
    if (!board) {
      board = new Map();
      whiteboardMemory.set(meetingId, board);
    }
    board.set(element.id, element);

    try {
      await redis.hset(this.getRedisKey(meetingId), element.id, JSON.stringify(element));
      await redis.expire(this.getRedisKey(meetingId), 86400 * 3);
    } catch {}

    return element;
  }

  public async updateObject(
    meetingId: string,
    elementId: string,
    patch: Partial<WhiteboardElement>
  ): Promise<WhiteboardElement | null> {
    const board = whiteboardMemory.get(meetingId);
    let existing = board?.get(elementId);

    if (!existing) {
      try {
        const raw = await redis.hget(this.getRedisKey(meetingId), elementId);
        if (raw) existing = JSON.parse(raw);
      } catch {}
    }

    if (!existing) return null;

    const updated: WhiteboardElement = {
      ...existing,
      ...patch,
      data: { ...existing.data, ...patch.data },
      updatedAt: new Date().toISOString(),
    };

    if (board) board.set(elementId, updated);

    try {
      await redis.hset(this.getRedisKey(meetingId), elementId, JSON.stringify(updated));
    } catch {}

    return updated;
  }

  public async deleteObject(meetingId: string, elementId: string): Promise<boolean> {
    const board = whiteboardMemory.get(meetingId);
    if (board) board.delete(elementId);

    try {
      await redis.hdel(this.getRedisKey(meetingId), elementId);
    } catch {}

    return true;
  }

  public async clearBoard(meetingId: string): Promise<boolean> {
    whiteboardMemory.delete(meetingId);
    try {
      await redis.del(this.getRedisKey(meetingId));
    } catch {}
    return true;
  }

  public async getState(meetingId: string): Promise<WhiteboardElement[]> {
    try {
      const hash = await redis.hgetall(this.getRedisKey(meetingId));
      if (hash && Object.keys(hash).length > 0) {
        return Object.values(hash).map((str) => JSON.parse(str));
      }
    } catch {}

    const board = whiteboardMemory.get(meetingId);
    return board ? Array.from(board.values()) : [];
  }
}

export const whiteboardService = new WhiteboardService();
