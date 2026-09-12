import type { ServerWebSocket } from "bun";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import { audioObserverService } from "../../infrastructure/mediasoup/audio-observer-service";
import {
  addRoomParticipant,
  removeRoomParticipant,
  getRoomParticipants,
  setUserPresence,
  saveMeetingPoll,
  getMeetingPolls,
  saveBreakoutState,
  getBreakoutState,
} from "../../infrastructure/redis";
import {
  type SocketData,
  registerSocket,
  unregisterSocket,
  broadcastToRoom,
  sendToParticipant,
  sendResponse,
  sendError,
  roomSockets,
  participantSockets,
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
        ws.data.role = role;

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
          role: ws.data.role,
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
        const { isAudioMuted, isVideoMuted, isScreenSharing, isHandRaised, screenTrackId, screenStreamId } = data;
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
            ...(screenTrackId !== undefined && { screenTrackId }),
            ...(screenStreamId !== undefined && { screenStreamId }),
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
              screenTrackId,
              screenStreamId,
            },
          }, ws);
        }
        sendResponse(ws, id, { updated: true });
        break;
      }

      case "webrtc:signal": {
        const { to, signal, appData } = data;
        if (ws.data.meetingId) {
          sendToParticipant(to, {
            event: "webrtc:signal",
            data: {
              from: ws.data.participantId,
              signal,
              appData,
            },
          });
        }
        sendResponse(ws, id, { forwarded: true });
        break;
      }

      case "chat:send": {
        const messagePayload = {
          id: data.id || crypto.randomUUID(),
          senderId: ws.data.participantId,
          senderName: ws.data.displayName || "Participant",
          content: data.content,
          messageType: data.messageType || (data.attachment ? "FILE" : "TEXT"),
          attachment: data.attachment, // { name, size, type, url }
          createdAt: new Date().toISOString(),
        };
        broadcastToRoom(ws.data.meetingId!, {
          event: "chat:message",
          data: messagePayload,
        }, ws);
        sendResponse(ws, id, { sent: true, message: messagePayload });
        break;
      }

      case "participant:kick": {
        const { targetParticipantId } = data;
        if (!ws.data.meetingId || !targetParticipantId) {
          sendError(ws, id, 400, "Invalid kick parameters");
          break;
        }

        const allParticipants = await getRoomParticipants(ws.data.meetingId);
        const caller = allParticipants.find((p: any) => (p.id || p.participantId) === ws.data.participantId);
        const isCallerHost = ws.data.role === "HOST" || caller?.role === "HOST";

        if (!isCallerHost) {
          sendError(ws, id, 403, "Only the meeting host can remove participants");
          break;
        }

        // Deliver kick event across any of the 40+ pods via sendToParticipant
        sendToParticipant(targetParticipantId, {
          event: "participant:kicked",
          data: {
            reason: "You were removed from the meeting by the host.",
            participantId: targetParticipantId,
          },
        });

        // Close local socket if hosted on this pod
        const targetWs = participantSockets.get(targetParticipantId);
        if (targetWs) {
          handleSocketClose(targetWs);
          targetWs.close();
        }

        broadcastToRoom(ws.data.meetingId, {
          event: "participant:left",
          data: { participantId: targetParticipantId },
        });

        sendResponse(ws, id, { kicked: true, targetParticipantId });
        break;
      }

      case "participant:controlMedia": {
        const { targetParticipantId, mediaType, muted } = data;
        if (!ws.data.meetingId || !targetParticipantId || !mediaType) {
          sendError(ws, id, 400, "Missing required parameters for controlMedia");
          break;
        }

        const allParticipants = await getRoomParticipants(ws.data.meetingId);
        const caller = allParticipants.find((p: any) => (p.id || p.participantId) === ws.data.participantId);
        const isCallerHost = ws.data.role === "HOST" || caller?.role === "HOST";

        if (!isCallerHost) {
          sendError(ws, id, 403, "Only the meeting host can control participant media");
          break;
        }

        // Deliver media command across any of the 40+ pods via sendToParticipant
        sendToParticipant(targetParticipantId, {
          event: "participant:forceMediaState",
          data: {
            mediaType,
            muted: Boolean(muted),
            by: ws.data.displayName || "Host",
            reason: muted
              ? (mediaType === "audio" ? "The host has muted your microphone." : "The host has turned off your camera.")
              : (mediaType === "audio" ? "The host is asking you to unmute your microphone." : "The host is asking you to turn on your camera."),
          },
        });

        if (muted) {
          const targetRecord = allParticipants.find((p: any) => (p.id || p.participantId) === targetParticipantId);
          if (targetRecord) {
            const updated = {
              ...targetRecord,
              ...(mediaType === "audio" ? { isAudioMuted: true } : { isVideoMuted: true }),
            };
            await addRoomParticipant(ws.data.meetingId, targetParticipantId, updated);
            broadcastToRoom(ws.data.meetingId, {
              event: "participant:mediaStateChanged",
              data: updated,
            });
          }
        }

        sendResponse(ws, id, { success: true, targetParticipantId, mediaType, muted });
        break;
      }

      case "participant:muteAll": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const allParticipants = await getRoomParticipants(ws.data.meetingId);
        const caller = allParticipants.find((p: any) => (p.id || p.participantId) === ws.data.participantId);
        const isCallerHost = ws.data.role === "HOST" || caller?.role === "HOST";

        if (!isCallerHost) {
          sendError(ws, id, 403, "Only the meeting host can mute all participants");
          break;
        }

        const sockets = roomSockets.get(ws.data.meetingId);
        if (sockets) {
          for (const s of sockets) {
            if (s.data.participantId !== ws.data.participantId && s.readyState === 1) {
              s.send(JSON.stringify({
                event: "participant:forceMediaState",
                data: {
                  mediaType: "audio",
                  muted: true,
                  by: ws.data.displayName || "Host",
                  reason: "The host has muted all participants.",
                },
              }));
            }
          }
        }

        for (const p of allParticipants) {
          const pid = p.id || p.participantId;
          if (pid !== ws.data.participantId) {
            const updated = { ...p, isAudioMuted: true };
            await addRoomParticipant(ws.data.meetingId, pid, updated);
            broadcastToRoom(ws.data.meetingId, {
              event: "participant:mediaStateChanged",
              data: updated,
            });
          }
        }

        sendResponse(ws, id, { success: true, mutedAll: true });
        break;
      }

      case "reaction:add": {
        broadcastToRoom(ws.data.meetingId!, {
          event: "reaction:received",
          data: { participantId: ws.data.participantId, emoji: data.emoji },
        }, ws);
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

      case "participant:setRole": {
        const { targetParticipantId, role } = data; // "CO_HOST" | "PARTICIPANT"
        if (!ws.data.meetingId || !targetParticipantId || !role) {
          sendError(ws, id, 400, "Missing required parameters");
          break;
        }

        if (ws.data.role !== "HOST") {
          sendError(ws, id, 403, "Only the meeting host can promote or demote participants");
          break;
        }

        const allParticipants = await getRoomParticipants(ws.data.meetingId);
        const targetRecord = allParticipants.find((p: any) => (p.id || p.participantId) === targetParticipantId);
        if (targetRecord) {
          const updated = { ...targetRecord, role };
          await addRoomParticipant(ws.data.meetingId, targetParticipantId, updated);

          const targetWs = participantSockets.get(targetParticipantId);
          if (targetWs) {
            targetWs.data.role = role;
          }

          broadcastToRoom(ws.data.meetingId, {
            event: "participant:roleChanged",
            data: { participantId: targetParticipantId, role },
          });
        }

        sendResponse(ws, id, { success: true, targetParticipantId, role });
        break;
      }

      case "participant:spotlight": {
        const { targetParticipantId } = data; // string or null to clear
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can spotlight a participant");
          break;
        }

        broadcastToRoom(ws.data.meetingId, {
          event: "participant:spotlighted",
          data: {
            participantId: targetParticipantId || null,
            spotlightParticipantId: targetParticipantId || null,
          },
        });

        sendResponse(ws, id, {
          success: true,
          participantId: targetParticipantId || null,
          spotlightParticipantId: targetParticipantId || null,
        });
        break;
      }

      case "poll:create": {
        const { question, options, isAnonymous } = data;
        if (!ws.data.meetingId || !question || !Array.isArray(options) || options.length < 2) {
          sendError(ws, id, 400, "Poll question and at least 2 options required");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can create polls");
          break;
        }

        const pollId = crypto.randomUUID();
        const newPoll = {
          id: pollId,
          meetingId: ws.data.meetingId,
          creatorId: ws.data.participantId,
          creatorName: ws.data.displayName || "Host",
          question,
          options: options.map((opt: string, idx: number) => ({
            id: idx,
            text: opt,
            votesCount: 0,
          })),
          votes: {} as Record<string, number>,
          totalVotes: 0,
          isAnonymous: Boolean(isAnonymous),
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        await saveMeetingPoll(ws.data.meetingId, newPoll);

        broadcastToRoom(ws.data.meetingId, {
          event: "poll:new",
          data: { ...newPoll, poll: newPoll },
        });

        sendResponse(ws, id, { success: true, poll: newPoll });
        break;
      }

      case "poll:vote": {
        const { pollId, optionIndex } = data;
        if (!ws.data.meetingId || !pollId || optionIndex === undefined) {
          sendError(ws, id, 400, "Missing pollId or optionIndex");
          break;
        }

        const polls = await getMeetingPolls(ws.data.meetingId);
        const poll = polls.find((p: any) => p.id === pollId);
        if (!poll || !poll.isActive) {
          sendError(ws, id, 400, "Poll is not active or does not exist");
          break;
        }

        const voterId = ws.data.participantId!;
        poll.votes = poll.votes || {};
        poll.votes[voterId] = Number(optionIndex);

        poll.options.forEach((opt: any, idx: number) => {
          opt.votesCount = Object.values(poll.votes).filter((v) => v === idx).length;
        });
        poll.totalVotes = Object.keys(poll.votes).length;

        await saveMeetingPoll(ws.data.meetingId, poll);

        broadcastToRoom(ws.data.meetingId, {
          event: "poll:updated",
          data: { ...poll, poll },
        });

        sendResponse(ws, id, { success: true, poll });
        break;
      }

      case "poll:end": {
        const { pollId } = data;
        if (!ws.data.meetingId || !pollId) {
          sendError(ws, id, 400, "Missing pollId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can end polls");
          break;
        }

        const polls = await getMeetingPolls(ws.data.meetingId);
        const poll = polls.find((p: any) => p.id === pollId);
        if (poll) {
          poll.isActive = false;
          poll.closedAt = new Date().toISOString();
          await saveMeetingPoll(ws.data.meetingId, poll);

          broadcastToRoom(ws.data.meetingId, {
            event: "poll:ended",
            data: { ...poll, pollId, poll },
          });
        }

        sendResponse(ws, id, { success: true, pollId });
        break;
      }

      case "poll:list": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }
        const polls = await getMeetingPolls(ws.data.meetingId);
        sendResponse(ws, id, { polls });
        break;
      }

      case "breakout:start": {
        const { rooms, durationMinutes } = data;
        if (!ws.data.meetingId || !Array.isArray(rooms)) {
          sendError(ws, id, 400, "Invalid breakout rooms data");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can manage breakout rooms");
          break;
        }

        const breakoutState = {
          meetingId: ws.data.meetingId,
          rooms: rooms.map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            name: r.name,
            participantIds: r.participantIds || [],
          })),
          durationMinutes: durationMinutes || 10,
          startedAt: new Date().toISOString(),
          isActive: true,
        };

        await saveBreakoutState(ws.data.meetingId, breakoutState);

        broadcastToRoom(ws.data.meetingId, {
          event: "breakout:started",
          data: breakoutState,
        });

        sendResponse(ws, id, { success: true, breakoutState });
        break;
      }

      case "breakout:broadcast": {
        const { message } = data;
        if (!ws.data.meetingId || !message) {
          sendError(ws, id, 400, "Missing message");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can broadcast to breakout rooms");
          break;
        }

        broadcastToRoom(ws.data.meetingId, {
          event: "breakout:broadcast",
          data: {
            message,
            senderName: ws.data.displayName || "Host",
            timestamp: new Date().toISOString(),
          },
        });

        sendResponse(ws, id, { success: true });
        break;
      }

      case "breakout:end": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can end breakout rooms");
          break;
        }

        await saveBreakoutState(ws.data.meetingId, null);

        broadcastToRoom(ws.data.meetingId, {
          event: "breakout:ended",
          data: { meetingId: ws.data.meetingId },
        });

        sendResponse(ws, id, { success: true, ended: true });
        break;
      }

      default:
        sendError(ws, id, 404, `Unknown signaling method: ${method}`);
    }
  } catch (err) {
    console.error("[Signaling] Packet processing error:", err);
  }
}
