import { create } from "zustand";
import type { ParticipantDTO, ParticipantRole } from "@meet/shared-types";

export type VideoLayout = "GRID" | "SPEAKER" | "SPOTLIGHT" | "SIDEBAR" | "PRESENTATION";

interface MeetingState {
  meetingId: string | null;
  slug: string | null;
  title: string;
  isHost: boolean;
  participants: Map<string, ParticipantDTO>;
  activeSpeakerId: string | null;
  speakingParticipants: Map<string, number>; // participantId -> volume (0-100)
  pinnedParticipantId: string | null;
  spotlightParticipantId: string | null;
  activePresenterId: string | null; // Multi-screenshare active presentation ID (or 'local')
  isTheaterMode: boolean; // Remote presentation mode / theater view
  layoutMode: VideoLayout;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  isParticipantsListOpen: boolean;
  isActivitiesOpen: boolean;
  isHandRaised: boolean;

  // Chat additions
  pinnedMessage: any | null;
  mutedChatUserIds: string[];

  // Recording state
  isRecording: boolean;
  recordingType: "CLOUD" | "LOCAL" | null;
  recordingDuration: number;
  recordingDownloadUrl: string | null;

  // Live Streaming state
  isLiveStreaming: boolean;
  liveStreamingDestinations: Array<{ id: string; platform: string; status: string }>;
  isStreamingModalOpen: boolean;

  // File Sharing & Whiteboard & Notification state
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

export const useMeetingStore = create<MeetingState>((set) => ({
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
  layoutMode: "GRID",
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

  setMeeting: ({ id, slug, title, isHost }) =>
    set({ meetingId: id, slug, title, isHost }),

  setMyParticipantId: (myParticipantId) => set({ myParticipantId }),

  addParticipant: (participant: any) =>
    set((state) => {
      const id = participant.id || participant.participantId;
      if (!id || id === state.myParticipantId) return state;
      const next = new Map(state.participants);
      const existing = next.get(id);
      next.set(id, {
        meetingId: state.meetingId || "",
        displayName: participant.displayName || "Participant",
        role: participant.role || "PARTICIPANT",
        isAudioMuted: participant.isAudioMuted ?? false,
        isVideoMuted: participant.isVideoMuted ?? false,
        isScreenSharing: participant.isScreenSharing ?? false,
        isHandRaised: participant.isHandRaised ?? false,
        connectionStatus: participant.connectionStatus || "CONNECTED",
        joinedAt: participant.joinedAt || new Date().toISOString(),
        ...existing,
        ...participant,
        id,
      });
      return { participants: next };
    }),

  removeParticipant: (participantId) =>
    set((state) => {
      const next = new Map(state.participants);
      next.delete(participantId);
      const nextSpeaking = new Map(state.speakingParticipants);
      nextSpeaking.delete(participantId);
      return {
        participants: next,
        speakingParticipants: nextSpeaking,
        activeSpeakerId: state.activeSpeakerId === participantId ? (nextSpeaking.size > 0 ? Array.from(nextSpeaking.keys())[0] : null) : state.activeSpeakerId,
        pinnedParticipantId: state.pinnedParticipantId === participantId ? null : state.pinnedParticipantId,
        activePresenterId: state.activePresenterId === participantId ? null : state.activePresenterId,
      };
    }),

  updateParticipant: (participantId, updates) =>
    set((state) => {
      if (!participantId || participantId === state.myParticipantId) return state;
      const next = new Map(state.participants);
      const existing = next.get(participantId);
      if (existing) {
        next.set(participantId, { ...existing, ...updates });
        let nextSpeaking = state.speakingParticipants;
        if (updates.isAudioMuted === true && state.speakingParticipants.has(participantId)) {
          nextSpeaking = new Map(state.speakingParticipants);
          nextSpeaking.delete(participantId);
        }
        return { participants: next, speakingParticipants: nextSpeaking };
      }
      return state;
    }),

  setActiveSpeaker: (activeSpeakerId) => set({ activeSpeakerId }),
  setParticipantSpeaking: (participantId, isSpeaking, volume = 100) =>
    set((state) => {
      const next = new Map(state.speakingParticipants);
      if (isSpeaking) {
        next.set(participantId, volume);
      } else {
        next.delete(participantId);
      }
      let nextActiveSpeakerId = state.activeSpeakerId;
      if (isSpeaking) {
        nextActiveSpeakerId = participantId;
      } else if (state.activeSpeakerId === participantId) {
        nextActiveSpeakerId = next.size > 0 ? Array.from(next.keys())[0] : null;
      }
      return { speakingParticipants: next, activeSpeakerId: nextActiveSpeakerId };
    }),
  setPinnedParticipant: (pinnedParticipantId) => set({ pinnedParticipantId }),
  setSpotlightParticipant: (spotlightParticipantId) => set({ spotlightParticipantId }),
  setActivePresenterId: (activePresenterId) => set({ activePresenterId }),
  toggleTheaterMode: () => set((s) => ({ isTheaterMode: !s.isTheaterMode })),
  setTheaterMode: (isTheaterMode) => set({ isTheaterMode }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleWhiteboard: () => set((s) => ({ isWhiteboardOpen: !s.isWhiteboardOpen })),
  toggleFileShare: () => set((s) => ({ isFileShareOpen: !s.isFileShareOpen })),
  toggleStreamingModal: () => set((s) => ({ isStreamingModalOpen: !s.isStreamingModalOpen })),
  toggleNotificationCenter: () => set((s) => ({ isNotificationCenterOpen: !s.isNotificationCenterOpen })),
  toggleParticipantsList: () => set((s) => ({ isParticipantsListOpen: !s.isParticipantsListOpen })),
  toggleActivities: () => set((s) => ({ isActivitiesOpen: !s.isActivitiesOpen })),
  setHandRaised: (isHandRaised) => set({ isHandRaised }),
  setMyRole: (myRole) => set({ myRole, isHost: myRole === "HOST" || myRole === "CO_HOST" }),
  setIsHost: (isHost) => set({ isHost }),

  setPinnedMessage: (pinnedMessage) => set({ pinnedMessage }),
  setChatUserMuted: (participantId, muted) =>
    set((state) => {
      const setIds = new Set(state.mutedChatUserIds);
      if (muted) setIds.add(participantId);
      else setIds.delete(participantId);
      return { mutedChatUserIds: Array.from(setIds) };
    }),
  setRecordingState: (isRecording, recordingType = null) =>
    set({ isRecording, recordingType: isRecording ? recordingType : null, recordingDuration: isRecording ? 0 : 0 }),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),
  setRecordingDownloadUrl: (recordingDownloadUrl) => set({ recordingDownloadUrl }),
  setLiveStreamingState: (isLiveStreaming, liveStreamingDestinations = []) =>
    set({ isLiveStreaming, liveStreamingDestinations }),

  reset: () =>
    set({
      meetingId: null,
      slug: null,
      title: "Meeting",
      isHost: false,
      myRole: "PARTICIPANT",
      participants: new Map(),
      activeSpeakerId: null,
      speakingParticipants: new Map(),
      pinnedParticipantId: null,
      spotlightParticipantId: null,
      activePresenterId: null,
      isTheaterMode: false,
      layoutMode: "GRID",
      isChatOpen: false,
      isWhiteboardOpen: false,
      isFileShareOpen: false,
      isStreamingModalOpen: false,
      isNotificationCenterOpen: false,
      isLiveStreaming: false,
      liveStreamingDestinations: [],
      isParticipantsListOpen: false,
      isActivitiesOpen: false,
      isHandRaised: false,
      pinnedMessage: null,
      mutedChatUserIds: [],
      isRecording: false,
      recordingType: null,
      recordingDuration: 0,
      recordingDownloadUrl: null,
    }),
}));
