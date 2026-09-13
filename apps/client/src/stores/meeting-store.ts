import { create } from "zustand";
import { MeetingState, initialMeetingState } from "./meeting-store-types";

export type { VideoLayout } from "./meeting-store-types";

export const useMeetingStore = create<MeetingState>((set) => ({
  ...initialMeetingState,

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
      if (isSpeaking) next.set(participantId, volume);
      else next.delete(participantId);

      let nextActiveSpeakerId = state.activeSpeakerId;
      if (isSpeaking) nextActiveSpeakerId = participantId;
      else if (state.activeSpeakerId === participantId) {
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

  reset: () => set(initialMeetingState),
}));
