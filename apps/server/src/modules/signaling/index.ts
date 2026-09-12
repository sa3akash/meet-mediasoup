import type { ServerWebSocket } from "bun";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import { audioObserverService } from "../../infrastructure/mediasoup/audio-observer-service";
import { addRoomParticipant, removeRoomParticipant, getRoomParticipants, setUserPresence } from "../../infrastructure/redis";
import {
  type SocketData,
  registerSocket,
  unregisterSocket,
  broadcastToRoom,
  sendResponse,
  sendError,
  roomSockets,
} from "./socket-registry";
import { handleWebRtcMessage } from "./handlers/webrtc-handlers";

// Listen to audioObserverService to broadcast active speaker changes
audioObserverService.on("activeSpeaker", ({ roomId, producerId, peerId, volume }) => {
  broadcastToRoom(roomId, {
    event: "webrtc:activeSpeaker",
    data: { producerId, peerId, volume },
  });
});

audioObserverService.on("silence", ({ roomId }) => {
  broadcastToRoom(roomId, {
    event: "webrtc:activeSpeaker",
    data: { producerId: null, peerId: null, volume: 0 },
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

export async function handleSocketMessage(ws: ServerWebSocket<SocketData>, message: any) {
  try {
    let packet: any;
    if (typeof message === "object" && message !== null && !Buffer.isBuffer(message)) {
      packet = message;
    } else {
      const raw = typeof message === "string" ? message : message.toString();
      packet = JSON.parse(raw);
    }
    if (!packet || typeof packet !== "object") return;
    const { id, method, data = {} } = packet;


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

        const participantRecord = {
          id: ws.data.participantId,
          participantId: ws.data.participantId,
          userId,
          displayName,
          role,
          isAudioMuted: false,
          isVideoMuted: false,
          isScreenSharing: false,
          isHandRaised: false,
          joinedAt: new Date().toISOString(),
        };

        await addRoomParticipant(meetingId, ws.data.participantId, participantRecord);

        if (userId) await setUserPresence(userId, "BUSY", meetingId);

        const rtpCapabilities = await roomManager.getRouterCapabilities(meetingId);
        const existingProducers = roomManager.getRoomProducers(meetingId, ws.data.participantId);
        const allParticipants = await getRoomParticipants(meetingId);
        const existingParticipants = allParticipants.filter(
          (p: any) => (p.id || p.participantId) !== ws.data.participantId
        );

        sendResponse(ws, id, {
          participantId: ws.data.participantId,
          rtpCapabilities,
          existingProducers,
          existingParticipants,
        });

        broadcastToRoom(meetingId, {
          event: "participant:joined",
          data: participantRecord,
        }, ws);
        break;
      }

      case "participant:updateMediaState": {
        const { isAudioMuted, isVideoMuted, isScreenSharing, isHandRaised } = data;
        if (ws.data.meetingId && ws.data.participantId) {
          const allParticipants = await getRoomParticipants(ws.data.meetingId);
          const current = allParticipants.find(
            (p: any) => (p.id || p.participantId) === ws.data.participantId
          ) || {
            id: ws.data.participantId,
            participantId: ws.data.participantId,
            displayName: ws.data.displayName,
          };
          const updatedRecord = {
            ...current,
            ...(isAudioMuted !== undefined && { isAudioMuted }),
            ...(isVideoMuted !== undefined && { isVideoMuted }),
            ...(isScreenSharing !== undefined && { isScreenSharing }),
            ...(isHandRaised !== undefined && { isHandRaised }),
          };
          await addRoomParticipant(ws.data.meetingId, ws.data.participantId, updatedRecord);

          broadcastToRoom(ws.data.meetingId, {
            event: "participant:mediaStateChanged",
            data: {
              participantId: ws.data.participantId,
              id: ws.data.participantId,
              isAudioMuted: updatedRecord.isAudioMuted,
              isVideoMuted: updatedRecord.isVideoMuted,
              isScreenSharing: updatedRecord.isScreenSharing,
              isHandRaised: updatedRecord.isHandRaised,
            },
          }, ws);
        }
        sendResponse(ws, id, { updated: true });
        break;
      }

      case "webrtc:signal": {
        const { to, signal, appData } = data;
        if (ws.data.meetingId) {
          const sockets = roomSockets.get(ws.data.meetingId);
          if (sockets) {
            for (const targetWs of sockets) {
              if (targetWs.data.participantId === to && targetWs.readyState === 1) {
                targetWs.send(JSON.stringify({
                  event: "webrtc:signal",
                  data: {
                    from: ws.data.participantId,
                    signal,
                    appData,
                  },
                }));
                break;
              }
            }
          }
        }
        sendResponse(ws, id, { forwarded: true });
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

      case "meeting:updateSettings": {
        broadcastToRoom(ws.data.meetingId!, {
          event: "meeting:settingsUpdated",
          data: { settings: data.settings },
        });
        sendResponse(ws, id, { updated: true });
        break;
      }

      case "meeting:endForAll": {
        broadcastToRoom(ws.data.meetingId!, {
          event: "meeting:ended",
          data: { meetingId: ws.data.meetingId, endedBy: ws.data.participantId },
        });
        sendResponse(ws, id, { ended: true });
        break;
      }

      default:
        sendError(ws, id, 404, `Unknown signaling method: ${method}`);
    }
  } catch (err) {
    console.error("[Signaling] Packet processing error:", err);
  }
}
