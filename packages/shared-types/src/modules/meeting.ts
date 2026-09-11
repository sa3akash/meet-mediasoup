import type { MeetingType, MeetingAccessLevel, MeetingStatus, ParticipantRole, ParticipantConnectionStatus } from "./enums";

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
