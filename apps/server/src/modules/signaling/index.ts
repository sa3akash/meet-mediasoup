import type { ServerWebSocket } from "bun";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import { workerPool } from "../../infrastructure/mediasoup/worker-pool";
import { addRoomParticipant, removeRoomParticipant, setUserPresence } from "../../infrastructure/redis";
import { db } from "../../infrastructure/database";
import { meetingParticipants, meetings } from "../../infrastructure/database/schema";
import { eq } from "drizzle-orm";

interface SocketData {
  meetingId?: string;
  participantId?: string;
  userId?: string;
  displayName?: string;
}

// Map of meetingId -> Set of active WebSockets
const roomSockets = new Map<string, Set<ServerWebSocket<SocketData>>>();

export function handleSocketOpen(ws: ServerWebSocket<SocketData>) {
  // Connection opened
}

export function handleSocketClose(ws: ServerWebSocket<SocketData>) {
  const { meetingId, participantId, userId } = ws.data;
  if (!meetingId || !participantId) return;

  const sockets = roomSockets.get(meetingId);
  if (sockets) {
    sockets.delete(ws);
    if (sockets.size === 0) {
      roomSockets.delete(meetingId);
    }
  }

  // Cleanup mediasoup peer transports and consumers
  roomManager.removePeer(meetingId, participantId);

  // Redis state cleanup
  removeRoomParticipant(meetingId, participantId);
  if (userId) {
    setUserPresence(userId, "ONLINE", null);
  }

  // Broadcast participant-left to other peers
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

    switch (method) {
      case "meeting:join": {
        const { meetingId, displayName, userId, role = "PARTICIPANT" } = data;
        ws.data.meetingId = meetingId;
        ws.data.participantId = ws.data.participantId || crypto.randomUUID();
        ws.data.userId = userId;
        ws.data.displayName = displayName;

        let sockets = roomSockets.get(meetingId);
        if (!sockets) {
          sockets = new Set();
          roomSockets.set(meetingId, sockets);

          // Listen to AudioLevelObserver for this room
          const router = await workerPool.getOrCreateRouter(meetingId);
          const observer = workerPool.getAudioObserver(meetingId);
          if (observer) {
            observer.on("volumes", (volumes) => {
              if (volumes.length > 0) {
                const loudest = volumes[0];
                broadcastToRoom(meetingId, {
                  event: "webrtc:activeSpeaker",
                  data: {
                    producerId: loudest.producer.id,
                    volume: loudest.volume,
                  },
                });
              }
            });
          }
        }
        sockets.add(ws);

        // Track in Redis
        await addRoomParticipant(meetingId, ws.data.participantId, {
          participantId: ws.data.participantId,
          userId,
          displayName,
          role,
        });

        if (userId) {
          await setUserPresence(userId, "BUSY", meetingId);
        }

        const rtpCapabilities = await roomManager.getRouterCapabilities(meetingId);
        const existingProducers = roomManager.getRoomProducers(meetingId, ws.data.participantId);

        // Respond to joined user
        sendResponse(ws, id, {
          participantId: ws.data.participantId,
          rtpCapabilities,
          existingProducers,
        });

        // Broadcast new participant to room
        broadcastToRoom(meetingId, {
          event: "participant:joined",
          data: {
            participantId: ws.data.participantId,
            userId,
            displayName,
            role,
          },
        }, ws);
        break;
      }

      case "webrtc:createWebRtcTransport": {
        const { direction } = data;
        const transportParams = await roomManager.createWebRtcTransport(
          ws.data.meetingId!,
          ws.data.participantId!,
          direction
        );
        sendResponse(ws, id, transportParams);
        break;
      }

      case "webrtc:connectWebRtcTransport": {
        const { transportId, dtlsParameters } = data;
        await roomManager.connectTransport(
          ws.data.meetingId!,
          ws.data.participantId!,
          transportId,
          dtlsParameters
        );
        sendResponse(ws, id, { connected: true });
        break;
      }

      case "webrtc:produce": {
        const { transportId, kind, rtpParameters, appData } = data;
        const producerId = await roomManager.produce(
          ws.data.meetingId!,
          ws.data.participantId!,
          transportId,
          kind,
          rtpParameters,
          appData
        );

        sendResponse(ws, id, { id: producerId });

        // Notify other participants in the room about the new producer
        broadcastToRoom(ws.data.meetingId!, {
          event: "webrtc:newProducer",
          data: {
            producerId,
            producerPeerId: ws.data.participantId,
            kind,
            appData,
          },
        }, ws);
        break;
      }

      case "webrtc:consume": {
        const { producerId, rtpCapabilities } = data;
        const consumeParams = await roomManager.consume(
          ws.data.meetingId!,
          ws.data.participantId!,
          producerId,
          rtpCapabilities
        );
        sendResponse(ws, id, consumeParams);
        break;
      }

      case "webrtc:restartIce": {
        const { transportId } = data;
        const iceParameters = await roomManager.restartIce(
          ws.data.meetingId!,
          ws.data.participantId!,
          transportId
        );
        sendResponse(ws, id, { iceParameters });
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
          data: {
            participantId: ws.data.participantId,
            emoji: data.emoji,
          },
        });
        sendResponse(ws, id, { acknowledged: true });
        break;
      }

      default:
        sendError(ws, id, 404, `Unknown signaling method: ${method}`);
    }
  } catch (err: any) {
    console.error("[Signaling] Error processing packet:", err);
  }
}

function sendResponse(ws: ServerWebSocket<SocketData>, id: string, data: any) {
  ws.send(JSON.stringify({ id, ok: true, data }));
}

function sendError(ws: ServerWebSocket<SocketData>, id: string, code: number, message: string) {
  ws.send(JSON.stringify({ id, ok: false, error: { code, message } }));
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
