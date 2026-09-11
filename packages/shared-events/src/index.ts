import type { ParticipantDTO, ChatMessageDTO, PollDTO } from "@meet/shared-types";

// Redis Channel Builders
export const RedisChannels = {
  roomBroadcast: (meetingId: string) => `meeting:room:${meetingId}:broadcast`,
  userSignaling: (userId: string) => `meeting:user:${userId}:signaling`,
  presenceSync: "meeting:presence:sync",
  systemAnnounce: "meeting:system:announcements",
} as const;

// BullMQ Queue Names
export const QueueNames = {
  EMAIL_DISPATCH: "email-dispatch-queue",
  VIDEO_RECORDING_PROCESSOR: "video-recording-processor-queue",
  FILE_VIRUS_SCAN: "file-virus-scan-queue",
  AUDIT_LOGS: "audit-logs-queue",
  WEBHOOK_DELIVERY: "webhook-delivery-queue",
} as const;

// Domain Event Names
export const DomainEvents = {
  // Meeting Life Cycle
  MEETING_CREATED: "meeting.created",
  MEETING_STARTED: "meeting.started",
  MEETING_ENDED: "meeting.ended",
  MEETING_LOCKED: "meeting.locked",

  // Participant Life Cycle
  PARTICIPANT_JOINED: "participant.joined",
  PARTICIPANT_LEFT: "participant.left",
  PARTICIPANT_MUTED: "participant.muted",
  PARTICIPANT_PROMOTED: "participant.promoted",
  PARTICIPANT_EXPELLED: "participant.expelled",
  WAITING_ROOM_JOINED: "waiting_room.joined",
  WAITING_ROOM_ADMITTED: "waiting_room.admitted",

  // WebRTC
  NEW_PRODUCER: "webrtc.new_producer",
  PRODUCER_CLOSED: "webrtc.producer_closed",
  ACTIVE_SPEAKER: "webrtc.active_speaker",

  // Collaboration
  CHAT_MESSAGE_SENT: "chat.message_sent",
  CHAT_REACTION_ADDED: "chat.reaction_added",
  POLL_CREATED: "poll.created",
  POLL_VOTED: "poll.voted",
  WHITEBOARD_MUTATED: "whiteboard.mutated",

  // Recordings & Streams
  RECORDING_STARTED: "recording.started",
  RECORDING_COMPLETED: "recording.completed",
  RECORDING_FAILED: "recording.failed",
  STREAM_STARTED: "stream.started",
  STREAM_STOPPED: "stream.stopped",
} as const;

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents];
