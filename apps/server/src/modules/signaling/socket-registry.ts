import type { ServerWebSocket } from "bun";
import {
  publishRoomEvent,
  publishParticipantEvent,
  subscribeToRoom,
  unsubscribeFromRoom,
  subscribeToParticipant,
  unsubscribeFromParticipant,
} from "../../infrastructure/redis/redis-pubsub";

export interface SocketData {
  meetingId?: string;
  participantId?: string;
  userId?: string;
  displayName?: string;
  role?: string;
}

// Map of meetingId -> Set of active WebSockets on this pod
export const roomSockets = new Map<string, Set<ServerWebSocket<SocketData>>>();

// Map of participantId -> WebSocket on this pod
export const participantSockets = new Map<string, ServerWebSocket<SocketData>>();

// Broadcast only to local WebSockets connected to this pod
export function broadcastLocally(
  meetingId: string,
  payload: { event: string; data: any },
  excludeParticipantId?: string
) {
  const sockets = roomSockets.get(meetingId);
  if (!sockets) return;
  const raw = JSON.stringify(payload);
  for (const socket of sockets) {
    if (socket.data.participantId !== excludeParticipantId && socket.readyState === 1) {
      socket.send(raw);
    }
  }
}

export function registerSocket(meetingId: string, ws: ServerWebSocket<SocketData>) {
  let sockets = roomSockets.get(meetingId);
  const isFirstInRoom = !sockets || sockets.size === 0;
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(meetingId, sockets);
  }
  sockets.add(ws);

  if (ws.data.participantId) {
    participantSockets.set(ws.data.participantId, ws);
    const pid = ws.data.participantId;
    subscribeToParticipant(pid, (payload) => {
      const target = participantSockets.get(pid);
      if (target && target.readyState === 1) {
        target.send(JSON.stringify(payload));
      }
    });
  }

  // If first socket for this room on this pod, subscribe to Redis Pub/Sub room channel
  if (isFirstInRoom) {
    subscribeToRoom(meetingId, (envelope) => {
      broadcastLocally(meetingId, envelope, envelope.excludeParticipantId);
    });
  }

  return sockets;
}

export function unregisterSocket(meetingId: string, ws: ServerWebSocket<SocketData>) {
  const sockets = roomSockets.get(meetingId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      roomSockets.delete(meetingId);
      unsubscribeFromRoom(meetingId);
    }
  }

  if (ws.data.participantId) {
    participantSockets.delete(ws.data.participantId);
    unsubscribeFromParticipant(ws.data.participantId);
  }
}

// Multi-Pod Distributed Broadcast: dispatches locally AND broadcasts across 40+ pods via Redis
export function broadcastToRoom(
  meetingId: string,
  payload: { event: string; data: any },
  excludeWs?: ServerWebSocket<SocketData>
) {
  const excludePid = excludeWs?.data?.participantId;
  // 1. Deliver to local sockets on this pod immediately
  broadcastLocally(meetingId, payload, excludePid);

  // 2. Publish to Redis Pub/Sub for all other pods
  publishRoomEvent(meetingId, payload, excludePid).catch(() => {});
}

// Multi-Pod Distributed Direct Message: sends directly if on this pod, or routes across pods via Redis
export function sendToParticipant(targetParticipantId: string, payload: any): boolean {
  const localWs = participantSockets.get(targetParticipantId);
  if (localWs && localWs.readyState === 1) {
    localWs.send(JSON.stringify(payload));
    return true;
  }

  // Not on this pod -> publish to Redis Pub/Sub so target pod delivers it
  publishParticipantEvent(targetParticipantId, payload).catch(() => {});
  return false;
}

export function sendResponse(ws: ServerWebSocket<SocketData>, id: string, data: any) {
  ws.send(JSON.stringify({ id, ok: true, data }));
}

export function sendError(ws: ServerWebSocket<SocketData>, id: string, code: number, message: string) {
  ws.send(JSON.stringify({ id, ok: false, error: { code, message } }));
}
