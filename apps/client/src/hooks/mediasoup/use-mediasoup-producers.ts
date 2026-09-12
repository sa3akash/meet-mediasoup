import { useCallback } from "react";
import { useMediaStore } from "../../stores/media-store";
import type { ScreenShareOptions } from "./mediasoup-types";

export function useMediasoupProducers(
  peerConnectionsRef: React.RefObject<Map<string, RTCPeerConnection>>,
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const toggleAudio = useCallback(async () => {
    const { localStream: currentStream, isAudioMuted, setAudioMuted } = useMediaStore.getState();
    const newMuted = !isAudioMuted;
    if (currentStream) {
      const audioTrack = currentStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !newMuted;
    }
    setAudioMuted(newMuted);
    sendRequest("participant:updateMediaState", { isAudioMuted: newMuted }).catch(() => {});
  }, [sendRequest]);

  const toggleVideo = useCallback(async () => {
    const { localStream: currentStream, isVideoMuted, setVideoMuted } = useMediaStore.getState();
    const newMuted = !isVideoMuted;
    if (currentStream) {
      const videoTrack = currentStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !newMuted;
    }
    setVideoMuted(newMuted);
    sendRequest("participant:updateMediaState", { isVideoMuted: newMuted }).catch(() => {});
  }, [sendRequest]);

  const stopScreenShare = useCallback(async () => {
    const { screenStream, setScreenStream, setScreenSharing } = useMediaStore.getState();
    if (screenStream) {
      screenStream.getTracks().forEach((track) => {
        peerConnectionsRef.current.forEach(async (pc, peerId) => {
          try {
            const sender = pc.getSenders().find((s) => s.track === track);
            if (sender) pc.removeTrack(sender);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendRequest("webrtc:signal", {
              to: peerId,
              signal: { type: "offer", sdp: offer.sdp },
              appData: { source: "screen-stopped" },
            }).catch(() => {});
          } catch {}
        });
        track.stop();
      });
    }
    setScreenStream(null);
    setScreenSharing(false);
    sendRequest("participant:updateMediaState", { isScreenSharing: false }).catch(() => {});
  }, [sendRequest, peerConnectionsRef]);

  const startScreenShare = useCallback(
    async (options?: ScreenShareOptions) => {
      try {
        const constraints: any = {
          video: {
            width: { max: 1920 },
            height: { max: 1080 },
            frameRate: { max: 30 },
            displaySurface: options?.displaySurface,
          },
          audio: options?.systemAudio !== false ? "include" : false,
        };

        const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
        const { setScreenStream, setScreenSharing } = useMediaStore.getState();
        setScreenStream(stream);
        setScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        const screenAudioTrack = stream.getAudioTracks()[0];

        if (screenTrack) {
          peerConnectionsRef.current.forEach(async (pc, peerId) => {
            try {
              pc.addTrack(screenTrack, stream);
              if (screenAudioTrack) pc.addTrack(screenAudioTrack, stream);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendRequest("webrtc:signal", {
                to: peerId,
                signal: { type: "offer", sdp: offer.sdp },
                appData: {
                  source: "screen",
                  screenTrackId: screenTrack.id,
                  screenStreamId: stream.id,
                },
              }).catch(() => {});
            } catch (e) {
              console.warn("[WebRTC] Screen share offer failed:", e);
            }
          });

          screenTrack.onended = () => stopScreenShare();
        }
        sendRequest("participant:updateMediaState", {
          isScreenSharing: true,
          screenTrackId: screenTrack?.id,
          screenStreamId: stream.id,
        }).catch(() => {});
      } catch (err) {
        console.warn("[WebRTC] Start screen share cancelled:", err);
      }
    },
    [sendRequest, stopScreenShare, peerConnectionsRef]
  );

  const pauseScreenShare = useCallback((paused: boolean) => {
    const { screenStream } = useMediaStore.getState();
    if (screenStream) {
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !paused;
    }
  }, []);

  const toggleScreenAudio = useCallback((muted: boolean) => {
    const { screenStream } = useMediaStore.getState();
    if (screenStream) {
      const audioTrack = screenStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !muted;
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const { isScreenSharing } = useMediaStore.getState();
    if (isScreenSharing) await stopScreenShare();
    else await startScreenShare();
  }, [startScreenShare, stopScreenShare]);

  return {
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    pauseScreenShare,
    toggleScreenAudio,
    toggleScreenShare,
  };
}
