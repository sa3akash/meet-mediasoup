import { useRef, useCallback } from "react";
import type { types } from "mediasoup-client";
import { useMediaStore } from "../../stores/media-store";
import { useMeetingStore } from "../../stores/meeting-store";

export function useConsumerManager(
  deviceRef: React.RefObject<types.Device | null>,
  recvTransportRef: React.RefObject<types.Transport | null>,
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const consumersRef = useRef<Map<string, types.Consumer>>(new Map());
  const { setRemoteStream } = useMediaStore();
  const { addParticipant, updateParticipant } = useMeetingStore();

  const consumeProducer = useCallback(
    async (
      producerId: string,
      peerId: string,
      kind: "audio" | "video",
      appData?: any
    ) => {
      if (!deviceRef.current || !recvTransportRef.current) return;
      try {
        // Guarantee the peer exists in meetingStore so their tile is rendered in the UI
        if (!useMeetingStore.getState().participants.has(peerId)) {
          addParticipant({
            id: peerId,
            meetingId: useMeetingStore.getState().meetingId || "",
            displayName: "Participant",
            role: "PARTICIPANT",
            isAudioMuted: false,
            isVideoMuted: false,
            isScreenSharing: false,
            isHandRaised: false,
            connectionStatus: "CONNECTED",
            joinedAt: new Date().toISOString(),
          });
        }

        const consumerParams = await sendRequest("webrtc:consume", {
          producerId,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
        });

        const mergedAppData = consumerParams.appData || appData || {};
        const consumer = await recvTransportRef.current.consume({
          id: consumerParams.id,
          producerId: consumerParams.producerId,
          kind: consumerParams.kind,
          rtpParameters: consumerParams.rtpParameters,
          appData: mergedAppData,
        });

        consumersRef.current.set(consumer.id, consumer);

        const remoteStream = new MediaStream([consumer.track]);
        const isScreen =
          mergedAppData.source === "screen" ||
          consumer.appData?.source === "screen";

        if (isScreen) {
          setRemoteStream(peerId, { screenStream: remoteStream });
          updateParticipant(peerId, { isScreenSharing: true });
        } else if (kind === "audio") {
          setRemoteStream(peerId, { audioStream: remoteStream });
        } else {
          setRemoteStream(peerId, { videoStream: remoteStream });
        }

        consumer.on("trackended", () => {
          consumersRef.current.delete(consumer.id);
          consumer.close();
          if (isScreen) {
            setRemoteStream(peerId, { screenStream: undefined });
            updateParticipant(peerId, { isScreenSharing: false });
          } else if (kind === "audio") {
            setRemoteStream(peerId, { audioStream: undefined });
          } else {
            setRemoteStream(peerId, { videoStream: undefined });
          }
        });

        consumer.on("transportclose", () => {
          consumersRef.current.delete(consumer.id);
        });
      } catch (e) {
        console.error("[WebRTC] consumeProducer failed:", e);
      }
    },
    [deviceRef, recvTransportRef, sendRequest, setRemoteStream, addParticipant, updateParticipant]
  );

  const closeAllConsumers = useCallback(() => {
    consumersRef.current.forEach((c) => c.close());
    consumersRef.current.clear();
  }, []);

  return { consumeProducer, closeAllConsumers, consumersRef };
}
