// Domain Enums & Roles
export type UserRole = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
export type PresenceStatus = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
export type MeetingType = "INSTANT" | "SCHEDULED" | "RECURRING" | "PERSONAL";
export type MeetingAccessLevel = "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
export type MeetingStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";
export type ParticipantRole = "HOST" | "CO_HOST" | "PARTICIPANT" | "GUEST";
export type ParticipantConnectionStatus = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";
export type WaitingRoomStatus = "PENDING" | "ADMITTED" | "REJECTED";
export type MessageType = "TEXT" | "FILE" | "SYSTEM" | "POLL";
export type RecordingType = "CLOUD" | "LOCAL";
export type RecordingFormat = "MP4" | "HLS";
export type RecordingStatus = "INITIALIZING" | "RECORDING" | "PROCESSING" | "READY" | "FAILED";
export type StreamingPlatform = "YOUTUBE" | "FACEBOOK" | "CUSTOM_RTMP";
export type StreamingStatus = "STARTING" | "STREAMING" | "STOPPED" | "ERROR";
export type NotificationType = "MEETING_REMINDER" | "INVITE" | "RECORDING_READY" | "CHAT_MENTION" | "SYSTEM";
export type FileScanStatus = "PENDING" | "CLEAN" | "INFECTED";
export type ReportCategory = "SPAM" | "HARASSMENT" | "INAPPROPRIATE_CONTENT" | "OTHER";
export type ReportStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";

// User & Auth Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  timezone: string;
  language: string;
  theme: "light" | "dark" | "system";
  presenceStatus: PresenceStatus;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

// Meeting Types
export interface MeetingSettings {
  waitingRoomEnabled: boolean;
  autoRecording: boolean;
  muteOnJoin: boolean;
  cameraOffOnJoin: boolean;
  disableScreenShare: boolean;
  disableChat: boolean;
  disableFileShare: boolean;
  disableReactions: boolean;
  lockMeeting: boolean;
  allowGuestUsers: boolean;
  maxParticipants: number;
}

export interface MeetingDTO {
  id: string;
  hostId: string;
  title: string;
  description?: string | null;
  slug: string;
  type: MeetingType;
  accessLevel: MeetingAccessLevel;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  status: MeetingStatus;
  recurrenceRule?: string | null;
  settings?: MeetingSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantDTO {
  id: string;
  meetingId: string;
  userId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  role: ParticipantRole;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  connectionStatus: ParticipantConnectionStatus;
  joinedAt: string;
}

// Chat Types
export interface ChatReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ChatMessageDTO {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  recipientId?: string | null;
  replyToId?: string | null;
  content: string;
  messageType: MessageType;
  reactions: Record<string, ChatReaction>;
  isPinned: boolean;
  createdAt: string;
}

// Poll Types
export interface PollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface PollDTO {
  id: string;
  meetingId: string;
  createdBy: string;
  question: string;
  options: PollOption[];
  isAnonymous: boolean;
  isActive: boolean;
  totalVotes: number;
  userVotedOptionId?: string | null;
  createdAt: string;
  closedAt?: string | null;
}

// Whiteboard Types
export type WhiteboardTool = "select" | "draw" | "rectangle" | "circle" | "text" | "sticky" | "eraser";

export interface WhiteboardElement {
  id: string;
  type: WhiteboardTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  createdBy: string;
  updatedAt: number;
}

// WebRTC & Mediasoup Signaling Types
export type MediaKind = "audio" | "video";
export type MediaSourceType = "mic" | "webcam" | "screen-video" | "screen-audio";

export interface RtpCapabilities {
  codecs?: any[];
  headerExtensions?: any[];
}

export interface RtpParameters {
  mid?: string;
  codecs: any[];
  headerExtensions?: any[];
  encodings?: any[];
  rtcp?: any;
}

export interface TransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
  sctpParameters?: any;
}

// WebSocket JSON-RPC Signaling Protocol
export interface SignalingRequest<T = any> {
  id: string;
  method: string;
  data: T;
}

export interface SignalingResponse<T = any> {
  id: string;
  ok: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface SignalingNotification<T = any> {
  event: string;
  data: T;
}

// WebRTC Signaling Events
export interface JoinMeetingPayload {
  meetingId: string;
  displayName: string;
  avatarUrl?: string;
  rtpCapabilities: RtpCapabilities;
  passcode?: string;
}

export interface CreateTransportPayload {
  direction: "send" | "recv";
  sctpCapabilities?: any;
}

export interface ConnectTransportPayload {
  transportId: string;
  dtlsParameters: any;
}

export interface ProducePayload {
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  appData: {
    source: MediaSourceType;
    [key: string]: any;
  };
}

export interface ConsumePayload {
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}

export interface ActiveSpeakerEvent {
  participantId: string;
  volume: number; // dB
}

export interface ConsumerLayersChangedEvent {
  consumerId: string;
  spatialLayer: number;
  temporalLayer: number;
}
