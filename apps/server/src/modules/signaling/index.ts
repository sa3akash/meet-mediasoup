import type { ServerWebSocket } from "bun";
import { db } from "../../infrastructure/database";
import { users } from "../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { abuseDetectionService } from "../moderation/abuse-detection-service";
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
import { chatService, type ChatMessage } from "../chat/chat-service";
import { recordingService } from "../recordings/recording-service";
import { streamingService } from "../streaming/streaming-service";
import { whiteboardService } from "../whiteboards/whiteboard-service";
import { fileService } from "../files/file-service";
import { notificationService } from "../notifications/notification-service";
import { analyticsService } from "../analytics/analytics-service";

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

        if (userId) {
          const userRec = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });
          if (userRec?.bannedAt) {
            sendError(ws, id, 403, "Your account has been suspended by an administrator.");
            ws.close();
            return;
          }
        }

        ws.data.meetingId = meetingId;
        ws.data.participantId = ws.data.participantId || crypto.randomUUID();
        ws.data.userId = userId;
        ws.data.displayName = displayName;
        const allParticipants = await getRoomParticipants(meetingId);
        const existingParticipants = allParticipants.filter(
          (p: any) => (p.id || p.participantId) !== ws.data.participantId
        );

        let effectiveRole = role;
        if (role === "PARTICIPANT" && existingParticipants.length === 0) {
          effectiveRole = "HOST";
        }
        ws.data.role = effectiveRole;

        registerSocket(meetingId, ws);

        const participantRecord = {
          id: ws.data.participantId,
          participantId: ws.data.participantId,
          userId,
          displayName,
          role: effectiveRole,
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

        const activeRecording = recordingService.getActiveRecording(meetingId);
        const chatHistory = await chatService.getHistory(meetingId);

        sendResponse(ws, id, {
          participantId: ws.data.participantId,
          role: ws.data.role,
          rtpCapabilities,
          existingProducers,
          existingParticipants,
          activeRecording,
          chatHistory,
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
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        if (chatService.isUserMuted(ws.data.meetingId, ws.data.participantId!)) {
          sendError(ws, id, 403, "You have been muted in the chat by the host.");
          break;
        }

        const content = data.content || "";

        // Moderation & Abuse / Spam Detection Filter
        const abuseCheck = abuseDetectionService.checkChatMessage(
          ws.data.participantId!,
          content,
          ws.data.userId
        );
        if (!abuseCheck.allowed) {
          sendError(ws, id, 400, abuseCheck.reason || "Message blocked by moderation filter.");
          break;
        }

        const linkPreview = data.linkPreview || chatService.extractLinkPreview(content);
        const mentions = data.mentions || chatService.extractMentions(content);

        const messagePayload: ChatMessage = {
          id: data.id || crypto.randomUUID(),
          meetingId: ws.data.meetingId,
          senderId: ws.data.participantId!,
          senderName: ws.data.displayName || "Participant",
          content,
          messageType: data.messageType || (data.attachment ? "FILE" : "TEXT"),
          attachment: data.attachment,
          replyTo: data.replyTo,
          mentions,
          linkPreview,
          reactions: {},
          isPinned: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        };

        await chatService.saveMessage(ws.data.meetingId, messagePayload);

        broadcastToRoom(ws.data.meetingId, {
          event: "chat:message",
          data: messagePayload,
        }, ws);

        sendResponse(ws, id, { sent: true, message: messagePayload });
        break;
      }

      case "chat:react": {
        const { messageId, emoji } = data;
        if (!ws.data.meetingId || !messageId || !emoji) {
          sendError(ws, id, 400, "Missing messageId or emoji");
          break;
        }

        const result = await chatService.addReaction(
          ws.data.meetingId,
          messageId,
          ws.data.participantId!,
          emoji
        );

        if (result) {
          broadcastToRoom(ws.data.meetingId, {
            event: "chat:reacted",
            data: {
              messageId,
              emoji,
              participantId: ws.data.participantId,
              participantName: ws.data.displayName,
              reactions: result.reactions,
            },
          });
          sendResponse(ws, id, { success: true, ...result });
        } else {
          sendError(ws, id, 404, "Message not found");
        }
        break;
      }

      case "chat:delete": {
        const { messageId } = data;
        if (!ws.data.meetingId || !messageId) {
          sendError(ws, id, 400, "Missing messageId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        // Allow author or privileged users to delete
        const deleted = await chatService.deleteMessage(ws.data.meetingId, messageId);
        if (deleted) {
          broadcastToRoom(ws.data.meetingId, {
            event: "chat:messageDeleted",
            data: { messageId, deletedBy: ws.data.displayName },
          });
          sendResponse(ws, id, { success: true, messageId });
        } else {
          sendError(ws, id, 404, "Message not found");
        }
        break;
      }

      case "chat:pin": {
        const { messageId, isPinned } = data;
        if (!ws.data.meetingId || !messageId) {
          sendError(ws, id, 400, "Missing messageId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can pin messages");
          break;
        }

        const pinned = await chatService.pinMessage(ws.data.meetingId, messageId, Boolean(isPinned));
        broadcastToRoom(ws.data.meetingId, {
          event: "chat:messagePinned",
          data: { messageId, isPinned: Boolean(isPinned), message: pinned },
        });
        sendResponse(ws, id, { success: true, isPinned: Boolean(isPinned), message: pinned });
        break;
      }

      case "chat:muteUser": {
        const { targetParticipantId, muted } = data;
        if (!ws.data.meetingId || !targetParticipantId) {
          sendError(ws, id, 400, "Missing targetParticipantId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can moderate chat users");
          break;
        }

        await chatService.muteUser(ws.data.meetingId, targetParticipantId, Boolean(muted));
        broadcastToRoom(ws.data.meetingId, {
          event: "chat:userMuted",
          data: {
            targetParticipantId,
            muted: Boolean(muted),
            by: ws.data.displayName || "Host",
          },
        });
        sendResponse(ws, id, { success: true, targetParticipantId, muted: Boolean(muted) });
        break;
      }

      case "chat:history": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }
        const history = await chatService.getHistory(ws.data.meetingId);
        sendResponse(ws, id, { messages: history });
        break;
      }

      case "chat:export": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }
        const transcript = await chatService.exportChat(ws.data.meetingId, data.format || "txt");
        sendResponse(ws, id, { transcript, format: data.format || "txt" });
        break;
      }

      case "recording:start": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          const all = await getRoomParticipants(ws.data.meetingId);
          const hasHost = all.some((p: any) => p.role === "HOST" || p.role === "CO_HOST");
          if (hasHost) {
            sendError(ws, id, 403, "Only the host or co-host can start cloud recordings");
            break;
          }
        }

        const result = await recordingService.startRecording({
          meetingId: ws.data.meetingId,
          triggeredBy: ws.data.participantId!,
          recordType: data.recordType || "COMBINED",
        });

        broadcastToRoom(ws.data.meetingId, {
          event: "recording:started",
          data: {
            recordingId: result.recordingId,
            startedAt: result.startedAt,
            recordType: result.recordType,
            by: ws.data.displayName || "Host",
          },
        });

        sendResponse(ws, id, { success: true, ...result });
        break;
      }

      case "recording:stop": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          const all = await getRoomParticipants(ws.data.meetingId);
          const hasHost = all.some((p: any) => p.role === "HOST" || p.role === "CO_HOST");
          if (hasHost) {
            sendError(ws, id, 403, "Only the host or co-host can stop cloud recordings");
            break;
          }
        }

        const result = await recordingService.stopRecording(ws.data.meetingId);

        broadcastToRoom(ws.data.meetingId, {
          event: "recording:stopped",
          data: {
            recordingId: result?.recordingId,
            mp4Url: result?.mp4Url,
            hlsUrl: result?.hlsUrl,
            durationSeconds: result?.durationSeconds,
            fileSizeBytes: result?.fileSizeBytes,
            by: ws.data.displayName || "Host",
          },
        });

        sendResponse(ws, id, { success: true, ...result });
        break;
      }

      case "recording:status": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }
        const status = recordingService.getActiveRecording(ws.data.meetingId);
        sendResponse(ws, id, { isRecording: Boolean(status), ...status });
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
        const isCallerPrivileged =
          ws.data.role === "HOST" ||
          ws.data.role === "MODERATOR" ||
          ws.data.role === "ADMIN" ||
          caller?.role === "HOST" ||
          caller?.role === "MODERATOR" ||
          caller?.role === "ADMIN";

        if (!isCallerPrivileged) {
          sendError(ws, id, 403, "Only the meeting host or moderators can remove participants");
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

      case "participant:speaking": {
        if (!ws.data.meetingId) break;
        const { isSpeaking, volume = 100 } = data;
        broadcastToRoom(ws.data.meetingId, {
          event: "webrtc:activeSpeaker",
          data: {
            peerId: ws.data.participantId,
            isSpeaking: !!isSpeaking,
            volume: isSpeaking ? volume : 0,
          },
        }, ws);
        if (id) sendResponse(ws, id, { success: true });
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
            votes: 0,
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
          const count = Object.values(poll.votes).filter((v) => v === idx).length;
          opt.votesCount = count;
          opt.votes = count;
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

      // ==========================================
      // LIVE STREAMING
      // ==========================================
      case "streaming:start": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }
        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can start live streaming");
          break;
        }

        const { platform = "CUSTOM_RTMP", destinationUrl, streamKey = "", destinations } = data;
        let destList: any[] = [];

        if (Array.isArray(destinations) && destinations.length > 0) {
          destList = destinations.map((d: any) => ({
            id: d.id || crypto.randomUUID(),
            platform: (d.platform || "CUSTOM_RTMP").toUpperCase(),
            rtmpUrl: d.rtmpUrl || d.destinationUrl,
            streamKey: d.streamKey || "",
          }));
        } else {
          let finalUrl = destinationUrl;
          const pUpper = platform.toUpperCase();
          if (pUpper.includes("YOUTUBE") && streamKey) {
            finalUrl = "rtmp://a.rtmp.youtube.com/live2";
          } else if (pUpper.includes("FACEBOOK") && streamKey) {
            finalUrl = "rtmps://live-api-s.facebook.com:443/rtmp";
          }

          if (!finalUrl) {
            sendError(ws, id, 400, "Destination URL or Stream Key is required");
            break;
          }

          destList = [{
            id: crypto.randomUUID(),
            platform: pUpper.includes("YOUTUBE") ? "YOUTUBE" : pUpper.includes("FACEBOOK") ? "FACEBOOK" : "CUSTOM_RTMP",
            rtmpUrl: finalUrl,
            streamKey,
          }];
        }

        try {
          const results = await streamingService.startStreaming(ws.data.meetingId, destList);

          broadcastToRoom(ws.data.meetingId, {
            event: "streaming:started",
            data: { streams: results, meetingId: ws.data.meetingId },
          });

          sendResponse(ws, id, { success: true, streams: results });
        } catch (e: any) {
          sendError(ws, id, 500, e.message || "Failed to start streaming");
        }
        break;
      }

      case "streaming:stop": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }
        const isPrivileged = ws.data.role === "HOST" || ws.data.role === "CO_HOST";
        if (!isPrivileged) {
          sendError(ws, id, 403, "Only the host or co-host can stop live streaming");
          break;
        }

        const { destinationId, streamId } = data;
        const stopped = await streamingService.stopStreaming(ws.data.meetingId, destinationId || streamId);
        broadcastToRoom(ws.data.meetingId, {
          event: "streaming:stopped",
          data: { streamId: destinationId || streamId, meetingId: ws.data.meetingId },
        });

        sendResponse(ws, id, { success: true, stopped });
        break;
      }

      case "streaming:status":
      case "streaming:list": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const status = streamingService.getStreamStatus(ws.data.meetingId);
        sendResponse(ws, id, { success: true, ...status });
        break;
      }

      // ==========================================
      // WHITEBOARD
      // ==========================================
      case "whiteboard:addElement":
      case "whiteboard:draw": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const { element } = data;
        if (!element || !element.id) {
          sendError(ws, id, 400, "Invalid whiteboard element");
          break;
        }

        element.createdBy = ws.data.participantId;
        element.createdByName = ws.data.displayName;
        element.createdAt = element.createdAt || new Date().toISOString();
        element.updatedAt = new Date().toISOString();

        await whiteboardService.addObject(ws.data.meetingId, element);

        broadcastToRoom(ws.data.meetingId, {
          event: "whiteboard:elementAdded",
          data: { element, senderId: ws.data.participantId },
        }, ws);

        sendResponse(ws, id, { success: true, element });
        break;
      }

      case "whiteboard:updateElement": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const { elementId, updates } = data;
        if (!elementId || !updates) {
          sendError(ws, id, 400, "Missing elementId or updates");
          break;
        }

        const updated = await whiteboardService.updateObject(ws.data.meetingId, elementId, updates);
        if (updated) {
          broadcastToRoom(ws.data.meetingId, {
            event: "whiteboard:elementUpdated",
            data: { element: updated, senderId: ws.data.participantId },
          }, ws);
        }

        sendResponse(ws, id, { success: true, element: updated });
        break;
      }

      case "whiteboard:clear": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        await whiteboardService.clearBoard(ws.data.meetingId);
        broadcastToRoom(ws.data.meetingId, {
          event: "whiteboard:cleared",
          data: { senderId: ws.data.participantId },
        });

        sendResponse(ws, id, { success: true });
        break;
      }

      case "whiteboard:state": {
        if (!ws.data.meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const elements = await whiteboardService.getState(ws.data.meetingId);
        sendResponse(ws, id, { success: true, elements });
        break;
      }

      // ==========================================
      // FILE SHARING
      // ==========================================
      case "file:upload": {
        const meetingId = data?.meetingId || ws.data.meetingId;
        if (!meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const { fileName, mimeType, base64Data } = data;
        if (!fileName || !base64Data) {
          sendError(ws, id, 400, "Missing file data or file name");
          break;
        }

        const buffer = Buffer.from(base64Data, "base64");
        const file = await fileService.uploadFile({
          meetingId,
          uploaderId: data.uploaderId || ws.data.userId || ws.data.participantId || "anonymous",
          uploaderName: data.uploaderName || ws.data.displayName || "Participant",
          fileName,
          mimeType: mimeType || "application/octet-stream",
          fileBuffer: buffer,
        });

        broadcastToRoom(meetingId, {
          event: "file:uploaded",
          data: { file },
        });

        sendResponse(ws, id, { success: true, file });
        break;
      }

      case "file:list": {
        const meetingId = data?.meetingId || ws.data.meetingId;
        if (!meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const files = await fileService.getMeetingFiles(meetingId);
        sendResponse(ws, id, { success: true, files });
        break;
      }

      case "file:delete": {
        const meetingId = data?.meetingId || ws.data.meetingId;
        if (!meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const { fileId } = data;
        const success = await fileService.deleteFile(meetingId, fileId);
        if (success) {
          broadcastToRoom(meetingId, {
            event: "file:deleted",
            data: { fileId },
          });
        }

        sendResponse(ws, id, { success });
        break;
      }

      // ==========================================
      // NOTIFICATIONS
      // ==========================================
      case "notification:send": {
        const { targetUserId, userEmail, type, title, message, body: bodyText, channels, metadata } = data;
        const text = message || bodyText;
        if (!targetUserId || !type || !title || !text) {
          sendError(ws, id, 400, "Missing required notification fields");
          break;
        }

        const notification = await notificationService.sendNotification({
          userId: targetUserId,
          userEmail,
          type,
          title,
          body: text,
          data: metadata,
          channels,
        });

        for (const [pid, socket] of participantSockets.entries()) {
          if (socket.data.userId === targetUserId && socket.readyState === 1) {
            sendToParticipant(pid, {
              event: "notification:received",
              data: { notification },
            });
          }
        }

        sendResponse(ws, id, { success: true, notification });
        break;
      }

      case "notification:list": {
        const targetUser = data.userId || ws.data.userId;
        if (!targetUser) {
          sendError(ws, id, 400, "Missing userId");
          break;
        }

        const notifications = await notificationService.listNotifications(targetUser);
        sendResponse(ws, id, { success: true, notifications });
        break;
      }

      case "notification:markRead": {
        const targetUser = data.userId || ws.data.userId;
        const { notificationId } = data;
        if (!targetUser || !notificationId) {
          sendError(ws, id, 400, "Missing userId or notificationId");
          break;
        }

        const success = await notificationService.markAsRead(targetUser, notificationId);
        sendResponse(ws, id, { success });
        break;
      }

      // ==========================================
      // ANALYTICS & TELEMETRY
      // ==========================================
      case "telemetry:report": {
        const meetingId = data.meetingId || ws.data.meetingId;
        if (!meetingId) {
          sendError(ws, id, 400, "Missing meetingId for telemetry report");
          break;
        }

        const tracked = await analyticsService.trackTelemetry(
          meetingId,
          ws.data.userId || ws.data.participantId,
          data
        );
        sendResponse(ws, id, { success: true, tracked });
        break;
      }

      case "analytics:getSummary": {
        const meetingId = data.meetingId || ws.data.meetingId;
        if (!meetingId) {
          sendError(ws, id, 400, "Missing meetingId");
          break;
        }

        const summary = await analyticsService.getMeetingSummary(meetingId);
        sendResponse(ws, id, { success: true, summary });
        break;
      }

      default:
        sendError(ws, id, 404, `Unknown signaling method: ${method}`);
    }
  } catch (err) {
    console.error("[Signaling] Packet processing error:", err);
  }
}
