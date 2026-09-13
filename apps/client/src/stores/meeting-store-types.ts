import type { ParticipantDTO, ParticipantRole } from "@meet/shared-types";

export type VideoLayout = "GRID" | "SPEAKER" | "SPOTLIGHT" | "SIDEBAR" | "PRESENTATION";

export interface MeetingState {
  meetingId: string | null;
  slug: string | null;
  title: string;
  isHost: boolean;
  participants: Map<string, ParticipantDTO>;
  activeSpeakerId: string | null;
  speakingParticipants: Map<string, number>;
  pinnedParticipantId: string | null;
  spotlightParticipantId: string | null;
  activePresenterId: string | null;
  isTheaterMode: boolean;
  layoutMode: VideoLayout;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  isParticipantsListOpen: boolean;
  isActivitiesOpen: boolean;
  isHandRaised: boolean;

  pinnedMessage: any | null;
  mutedChatUserIds: string[];

  isRecording: boolean;
  recordingType: "CLOUD" | "LOCAL" | null;
  recordingDuration: number;
  recordingDownloadUrl: string | null;

  isLiveStreaming: boolean;
  liveStreamingDestinations: Array<{ id: string; platform: string; status: string }>;
  isStreamingModalOpen: boolean;

  isFileShareOpen: boolean;
  isNotificationCenterOpen: boolean;

  myParticipantId: string | null;
  myRole: string;

  setMeeting: (meeting: { id: string; slug: string; title: string; isHost: boolean }) => void;
  setMyParticipantId: (id: string) => void;
  addParticipant: (participant: any) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: any) => void;
  setActiveSpeaker: (id: string | null) => void;
  setParticipantSpeaking: (participantId: string, isSpeaking: boolean, volume?: number) => void;
  setPinnedParticipant: (id: string | null) => void;
  setSpotlightParticipant: (id: string | null) => void;
  setActivePresenterId: (id: string | null) => void;
  toggleTheaterMode: () => void;
  setTheaterMode: (isTheaterMode: boolean) => void;
  setLayoutMode: (mode: VideoLayout) => void;
  toggleChat: () => void;
  toggleWhiteboard: () => void;
  toggleFileShare: () => void;
  toggleStreamingModal: () => void;
  toggleNotificationCenter: () => void;
  toggleParticipantsList: () => void;
  toggleActivities: () => void;
  setHandRaised: (raised: boolean) => void;
  setMyRole: (role: ParticipantRole) => void;
  setIsHost: (isHost: boolean) => void;

  setPinnedMessage: (message: any | null) => void;
  setChatUserMuted: (participantId: string, muted: boolean) => void;
  setRecordingState: (isRecording: boolean, type?: "CLOUD" | "LOCAL" | null) => void;
  setRecordingDuration: (duration: number) => void;
  setRecordingDownloadUrl: (url: string | null) => void;
  setLiveStreamingState: (isStreaming: boolean, destinations?: Array<{ id: string; platform: string; status: string }>) => void;
  reset: () => void;
}

export const initialMeetingState = {
  meetingId: null,
  slug: null,
  title: "Meeting",
  isHost: false,
  participants: new Map(),
  myParticipantId: null,
  myRole: "PARTICIPANT",
  activeSpeakerId: null,
  speakingParticipants: new Map(),
  pinnedParticipantId: null,
  spotlightParticipantId: null,
  activePresenterId: null,
  isTheaterMode: false,
  layoutMode: "GRID" as VideoLayout,
  isChatOpen: false,
  isWhiteboardOpen: false,
  isParticipantsListOpen: false,
  isActivitiesOpen: false,
  isHandRaised: false,
  pinnedMessage: null,
  mutedChatUserIds: [],
  isRecording: false,
  recordingType: null,
  recordingDuration: 0,
  recordingDownloadUrl: null,
  isLiveStreaming: false,
  liveStreamingDestinations: [],
  isStreamingModalOpen: false,
  isFileShareOpen: false,
  isNotificationCenterOpen: false,
};
