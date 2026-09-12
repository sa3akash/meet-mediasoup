import { create } from "zustand";
import type { ParticipantDTO } from "@meet/shared-types";

export type VideoLayout = "GRID" | "SPEAKER" | "SPOTLIGHT" | "SIDEBAR";

interface MeetingState {
  meetingId: string | null;
  slug: string | null;
  title: string;
  isHost: boolean;
  participants: Map<string, ParticipantDTO>;
  activeSpeakerId: string | null;
  pinnedParticipantId: string | null;
  layoutMode: VideoLayout;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  isParticipantsListOpen: boolean;
  isHandRaised: boolean;
  myParticipantId: string | null;

  setMeeting: (meeting: { id: string; slug: string; title: string; isHost: boolean }) => void;
  setMyParticipantId: (id: string | null) => void;
  addParticipant: (participant: ParticipantDTO) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipant: (participantId: string, updates: Partial<ParticipantDTO>) => void;
  setActiveSpeaker: (participantId: string | null) => void;
  setPinnedParticipant: (participantId: string | null) => void;
  setLayoutMode: (mode: VideoLayout) => void;
  toggleChat: () => void;
  toggleWhiteboard: () => void;
  toggleParticipantsList: () => void;
  setHandRaised: (raised: boolean) => void;
  reset: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetingId: null,
  slug: null,
  title: "Meeting",
  isHost: false,
  participants: new Map(),
  myParticipantId: null,
  activeSpeakerId: null,
  pinnedParticipantId: null,
  layoutMode: "GRID",
  isChatOpen: false,
  isWhiteboardOpen: false,
  isParticipantsListOpen: false,
  isHandRaised: false,

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
      return {
        participants: next,
        activeSpeakerId: state.activeSpeakerId === participantId ? null : state.activeSpeakerId,
        pinnedParticipantId: state.pinnedParticipantId === participantId ? null : state.pinnedParticipantId,
      };
    }),

  updateParticipant: (participantId, updates) =>
    set((state) => {
      if (!participantId || participantId === state.myParticipantId) return state;
      const next = new Map(state.participants);
      const existing = next.get(participantId);
      if (existing) {
        next.set(participantId, { ...existing, ...updates });
        return { participants: next };
      }
      return state;
    }),

  setActiveSpeaker: (activeSpeakerId) => set({ activeSpeakerId }),
  setPinnedParticipant: (pinnedParticipantId) => set({ pinnedParticipantId }),
  setLayoutMode: (layoutMode) => set({ layoutMode }),
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleWhiteboard: () => set((s) => ({ isWhiteboardOpen: !s.isWhiteboardOpen })),
  toggleParticipantsList: () => set((s) => ({ isParticipantsListOpen: !s.isParticipantsListOpen })),
  setHandRaised: (isHandRaised) => set({ isHandRaised }),

  reset: () =>
    set({
      meetingId: null,
      slug: null,
      title: "Meeting",
      isHost: false,
      participants: new Map(),
      activeSpeakerId: null,
      pinnedParticipantId: null,
      layoutMode: "GRID",
      isChatOpen: false,
      isWhiteboardOpen: false,
      isParticipantsListOpen: false,
      isHandRaised: false,
    }),
}));
