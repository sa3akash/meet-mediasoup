export function getWsUrl(): string {
  let url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";
  if (!url.endsWith("/ws")) {
    url = `${url.replace(/\/+$/, "")}/ws`;
  }
  return url;
}

export const WS_URL = getWsUrl();

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export interface MediaForcedEvent {
  mediaType: "audio" | "video";
  muted: boolean;
  by?: string;
  reason?: string;
}

export interface ScreenShareOptions {
  displaySurface?: "monitor" | "window" | "browser";
  systemAudio?: boolean;
}

export interface BreakoutRoomInfo {
  id: string;
  name: string;
  participantIds: string[];
}

export interface BreakoutStateEvent {
  rooms: BreakoutRoomInfo[];
  durationMinutes?: number;
  endsAt?: number;
}

export interface PollOption {
  text: string;
  votes?: number;
  votesCount?: number;
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  isActive: boolean;
  totalVotes: number;
  userVotedIndex?: number;
}

export interface UseMediasoupCallbacks {
  onChatMessage?: (msg: any) => void;
  onReactionReceived?: (emoji: string) => void;
  onMeetingEnded?: () => void;
  onSettingsUpdated?: (settings: any) => void;
  onKicked?: (reason: string) => void;
  onMediaForced?: (event: MediaForcedEvent) => void;
  onRoleChanged?: (participantId: string, role: string) => void;
  onSpotlighted?: (participantId: string | null) => void;
  onPollNew?: (poll: PollData) => void;
  onPollUpdated?: (poll: PollData) => void;
  onPollEnded?: (pollId: string, poll: PollData) => void;
  onBreakoutStarted?: (data: BreakoutStateEvent) => void;
  onBreakoutBroadcast?: (data: { message: string; from: string }) => void;
  onBreakoutEnded?: () => void;
  onChatHistory?: (messages: any[]) => void;
  onChatReacted?: (data: any) => void;
  onChatMessageDeleted?: (data: { messageId: string }) => void;
  onChatMessagePinned?: (data: { messageId: string; isPinned: boolean; message: any }) => void;
  onChatUserMuted?: (data: { targetParticipantId: string; muted: boolean; by: string }) => void;
  onRecordingStarted?: (data: { recordingId: string; startedAt: string; recordType: string; by: string }) => void;
  onRecordingStopped?: (data: any) => void;
  onLiveStreamingStarted?: (data: any) => void;
  onLiveStreamingStopped?: (data: any) => void;
  onWhiteboardElementAdded?: (data: any) => void;
  onWhiteboardElementUpdated?: (data: any) => void;
  onWhiteboardCleared?: () => void;
  onFileUploaded?: (data: any) => void;
  onFileDeleted?: (data: any) => void;
  onNotificationReceived?: (data: any) => void;
}
