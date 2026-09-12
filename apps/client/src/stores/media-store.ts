import { create } from "zustand";

interface RemoteMedia {
  audioStream?: MediaStream;
  videoStream?: MediaStream;
  screenStream?: MediaStream;
}

interface MediaState {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;

  audioDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string | null;
  selectedVideoDeviceId: string | null;

  remoteStreams: Map<string, RemoteMedia>;

  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  setAudioMuted: (muted: boolean) => void;
  setVideoMuted: (muted: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setDevices: (audio: MediaDeviceInfo[], video: MediaDeviceInfo[]) => void;
  setSelectedDevices: (audioId?: string, videoId?: string) => void;
  setRemoteStream: (participantId: string, media: Partial<RemoteMedia>) => void;
  removeRemoteStream: (participantId: string) => void;
  resetMedia: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  localStream: null,
  screenStream: null,
  isAudioMuted: false,
  isVideoMuted: false,
  isScreenSharing: false,

  audioDevices: [],
  videoDevices: [],
  selectedAudioDeviceId: null,
  selectedVideoDeviceId: null,

  remoteStreams: new Map(),

  setLocalStream: (stream) => {
    set({ localStream: stream });
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      set({
        isAudioMuted: audioTrack ? !audioTrack.enabled : true,
        isVideoMuted: videoTrack ? !videoTrack.enabled : true,
      });
    }
  },

  setScreenStream: (stream) => set({ screenStream: stream, isScreenSharing: !!stream }),

  toggleAudio: () => {
    const { localStream, isAudioMuted } = get();
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = isAudioMuted;
        set({ isAudioMuted: !isAudioMuted });
      }
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoMuted } = get();
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = isVideoMuted;
        set({ isVideoMuted: !isVideoMuted });
      }
    }
  },

  setAudioMuted: (muted) => {
    const { localStream } = get();
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) track.enabled = !muted;
    }
    set({ isAudioMuted: muted });
  },

  setVideoMuted: (muted) => {
    const { localStream } = get();
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) track.enabled = !muted;
    }
    set({ isVideoMuted: muted });
  },

  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),

  setDevices: (audioDevices, videoDevices) =>
    set({
      audioDevices,
      videoDevices,
      selectedAudioDeviceId: audioDevices[0]?.deviceId || null,
      selectedVideoDeviceId: videoDevices[0]?.deviceId || null,
    }),

  setSelectedDevices: (selectedAudioDeviceId, selectedVideoDeviceId) =>
    set((s) => ({
      selectedAudioDeviceId: selectedAudioDeviceId ?? s.selectedAudioDeviceId,
      selectedVideoDeviceId: selectedVideoDeviceId ?? s.selectedVideoDeviceId,
    })),

  setRemoteStream: (participantId, media) =>
    set((state) => {
      const next = new Map(state.remoteStreams);
      const existing = next.get(participantId) || {};
      next.set(participantId, { ...existing, ...media });
      return { remoteStreams: next };
    }),

  removeRemoteStream: (participantId) =>
    set((state) => {
      const next = new Map(state.remoteStreams);
      next.delete(participantId);
      return { remoteStreams: next };
    }),

  resetMedia: () => {
    const { localStream, screenStream } = get();
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    set({
      localStream: null,
      screenStream: null,
      isAudioMuted: false,
      isVideoMuted: false,
      isScreenSharing: false,
      remoteStreams: new Map(),
    });
  },
}));
