import type { ServerWebSocket } from "bun";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import { audioObserverService } from "../../infrastructure/mediasoup/audio-observer-service";
import { addRoomParticipant, removeRoomParticipant, setUserPresence } from "../../infrastructure/redis";
import {
  type SocketData,
  registerSocket,
  unregisterSocket,
  broadcastToRoom,
  sendResponse,
  sendError,
} from "./socket-registry";
import { handleWebRtcMessage } from "./handlers/webrtc-handlers";

// Listen to audioObserverService to broadcast active speaker changes
audioObserverService.on("activeSpeaker", ({ roomId, producerId, volume }) => {
  broadcastToRoom(roomId, {
    event: "webrtc:activeSpeaker",
    data: { producerId, volume },
  });
});

export function handleSocketOpen(ws: ServerWebSocket<SocketData>) {}

export function handleSocketClose(ws: ServerWebSocket<SocketData>) {
  const { meetingId, participantId, userId } = ws.data;
  if (!meetingId || !participantId) return;

  unregisterSocket(meetingId, ws);
  roomManager.removePeer(meetingId, participantId);
  removeRoomParticipant(meetingId, participantId);

  if (userId) {
    setUserPresence(userId, "ONLINE", null);
  }

  broadcastToRoom(meetingId, {
    event: "participant:left",
    data: { participantId },
  }, ws);
}

export async function handleSocketMessage(ws: ServerWebSocket<SocketData>, message: string | Buffer) {
  try {
    const raw = typeof message === "string" ? message : message.toString();
    const packet = JSON.parse(raw);
    const { id, method, data } = packet;

    // Delegate WebRTC requests first
    const handled = await handleWebRtcMessage(ws, id, method, data);
    if (handled) return;

    switch (method) {
      case "meeting:join": {
        const { meetingId, displayName, userId, role = "PARTICIPANT" } = data;
        ws.data.meetingId = meetingId;
        ws.data.participantId = ws.data.participantId || crypto.randomUUID();
        ws.data.userId = userId;
        ws.data.displayName = displayName;

        registerSocket(meetingId, ws);

        await addRoomParticipant(meetingId, ws.data.participantId, {
          participantId: ws.data.participantId,
          userId,
          displayName,
          role,
        });

        if (userId) await setUserPresence(userId, "BUSY", meetingId);

        const rtpCapabilities = await roomManager.getRouterCapabilities(meetingId);
        const existingProducers = roomManager.getRoomProducers(meetingId, ws.data.participantId);

        sendResponse(ws, id, {
          participantId: ws.data.participantId,
          rtpCapabilities,
          existingProducers,
        });

        broadcastToRoom(meetingId, {
          event: "participant:joined",
          data: { participantId: ws.data.participantId, userId, displayName, role },
        }, ws);
        break;
      }

      case "chat:send": {
        broadcastToRoom(ws.data.meetingId!, {
          event: "chat:message",
          data: {
            id: crypto.randomUUID(),
            senderId: ws.data.participantId,
            senderName: ws.data.displayName,
            content: data.content,
            messageType: data.messageType || "TEXT",
            createdAt: new Date().toISOString(),
          },
        });
        sendResponse(ws, id, { sent: true });
        break;
      }

      case "reaction:add": {
        broadcastToRoom(ws.data.meetingId!, {
          event: "reaction:received",
          data: { participantId: ws.data.participantId, emoji: data.emoji },
        });
        sendResponse(ws, id, { acknowledged: true });
        break;
      }

      default:
        sendError(ws, id, 404, `Unknown signaling method: ${method}`);
    }
  } catch (err) {
    console.error("[Signaling] Packet processing error:", err);
  }
}
