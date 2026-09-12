import { useCallback } from "react";
import { useMediaStore } from "../../stores/media-store";
import { useMeetingStore } from "../../stores/meeting-store";
import { RTC_CONFIG } from "./mediasoup-types";

export function useMediasoupTransports(
  peerConnectionsRef: React.RefObject<Map<string, RTCPeerConnection>>,
  remoteScreenTrackIdsRef: React.RefObject<Map<string, Set<string>>>,
  remoteScreenStreamIdsRef: React.RefObject<Map<string, Set<string>>>,
  localStreamRef: React.RefObject<MediaStream | null>,
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const { setRemoteStream } = useMediaStore();
  const { updateParticipant } = useMeetingStore();

  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing && existing.connectionState !== "closed") {
        return existing;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendRequest("webrtc:signal", {
            to: peerId,
            signal: { type: "candidate", candidate: event.candidate.toJSON() },
          }).catch(() => {});
        }
      };

      pc.ontrack = (event) => {
        const track = event.track;
        const stream = event.streams[0] || new MediaStream([track]);
        const knownScreenTracks = remoteScreenTrackIdsRef.current.get(peerId);
        const knownScreenStreams = remoteScreenStreamIdsRef.current.get(peerId);
        const existingRemote = useMediaStore.getState().remoteStreams.get(peerId);
        const existingParticipant = useMeetingStore.getState().participants.get(peerId);

        const hasActiveCamera =
          existingRemote?.videoStream &&
          existingRemote.videoStream.getVideoTracks().some(
            (t) => t.readyState === "live" && t.id !== track.id
          );

        const isKnownScreen = Boolean(
          (knownScreenTracks && knownScreenTracks.has(track.id)) ||
          (event.streams[0] && knownScreenStreams && knownScreenStreams.has(event.streams[0].id))
        );

        const isLabelScreen =
          track.label.toLowerCase().includes("screen") ||
          track.label.toLowerCase().includes("display") ||
          track.label.toLowerCase().includes("window");

        const isScreen =
          isKnownScreen ||
          isLabelScreen ||
          Boolean(hasActiveCamera) ||
          Boolean(existingParticipant?.isScreenSharing && !existingRemote?.screenStream);

        if (track.kind === "video") {
          if (isScreen) {
            setRemoteStream(peerId, { screenStream: stream });
            updateParticipant(peerId, { isScreenSharing: true });
          } else {
            setRemoteStream(peerId, { videoStream: stream });
          }
        } else if (track.kind === "audio") {
          if (!isScreen) {
            setRemoteStream(peerId, { audioStream: stream });
          }
        }

        track.onended = () => {
          if (isScreen) {
            setRemoteStream(peerId, { screenStream: undefined });
            updateParticipant(peerId, { isScreenSharing: false });
            if (knownScreenTracks) knownScreenTracks.delete(track.id);
            if (event.streams[0] && knownScreenStreams) knownScreenStreams.delete(event.streams[0].id);
          }
        };
      };

      const currentLocal = localStreamRef.current || useMediaStore.getState().localStream;
      if (currentLocal) {
        currentLocal.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, currentLocal);
          } catch {}
        });
      }

      const currentScreen = useMediaStore.getState().screenStream;
      if (currentScreen) {
        currentScreen.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, currentScreen);
          } catch {}
        });
      }

      return pc;
    },
    [sendRequest, setRemoteStream, updateParticipant, localStreamRef, peerConnectionsRef, remoteScreenTrackIdsRef, remoteScreenStreamIdsRef]
  );

  const initiatePeerConnection = useCallback(
    async (peerId: string) => {
      try {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);

        const currentScreen = useMediaStore.getState().screenStream;
        const screenTrack = currentScreen?.getVideoTracks()[0];

        await sendRequest("webrtc:signal", {
          to: peerId,
          signal: { type: "offer", sdp: offer.sdp },
          appData: currentScreen
            ? { source: "screen", screenTrackId: screenTrack?.id, screenStreamId: currentScreen.id }
            : undefined,
        });
      } catch (err) {
        console.warn("[WebRTC] initiatePeerConnection error:", err);
      }
    },
    [createPeerConnection, sendRequest]
  );

  return {
    createPeerConnection,
    initiatePeerConnection,
  };
}
