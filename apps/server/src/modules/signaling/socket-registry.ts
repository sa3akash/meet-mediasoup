import type { ServerWebSocket } from "bun";

export interface SocketData {
  meetingId?: string;
  participantId?: string;
  userId?: string;
  displayName?: string;
  role?: string;
}

// Map of meetingId -> Set of active WebSockets
export const roomSockets = new Map<string, Set<ServerWebSocket<SocketData>>>();

export function registerSocket(meetingId: string, ws: ServerWebSocket<SocketData>) {
  let sockets = roomSockets.get(meetingId);
  if (!sockets) {
    sockets = new Set();
    roomSockets.set(meetingId, sockets);
  }
  sockets.add(ws);
  return sockets;
}

export function unregisterSocket(meetingId: string, ws: ServerWebSocket<SocketData>) {
  const sockets = roomSockets.get(meetingId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      roomSockets.delete(meetingId);
    }
  }
}

export function broadcastToRoom(
  meetingId: string,
  payload: { event: string; data: any },
  excludeWs?: ServerWebSocket<SocketData>
) {
  const sockets = roomSockets.get(meetingId);
  if (!sockets) return;
  const raw = JSON.stringify(payload);
  for (const socket of sockets) {
    if (socket !== excludeWs && socket.readyState === 1) {
      socket.send(raw);
    }
  }
}

export function sendResponse(ws: ServerWebSocket<SocketData>, id: string, data: any) {
  ws.send(JSON.stringify({ id, ok: true, data }));
}

export function sendError(ws: ServerWebSocket<SocketData>, id: string, code: number, message: string) {
  ws.send(JSON.stringify({ id, ok: false, error: { code, message } }));
}
