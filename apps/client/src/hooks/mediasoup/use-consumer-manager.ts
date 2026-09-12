import { useRef, useCallback } from "react";
import type { types } from "mediasoup-client";
import { useMediaStore } from "../../stores/media-store";

export function useConsumerManager(
  deviceRef: React.RefObject<types.Device | null>,
  recvTransportRef: React.RefObject<types.Transport | null>,
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const consumersRef = useRef<Map<string, types.Consumer>>(new Map());
  const { setRemoteStream } = useMediaStore();

  const consumeProducer = useCallback(
    async (producerId: string, peerId: string, kind: "audio" | "video") => {
      if (!deviceRef.current || !recvTransportRef.current) return;
      try {
        const consumerParams = await sendRequest("webrtc:consume", {
          producerId,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
        });

        const consumer = await recvTransportRef.current.consume({
          id: consumerParams.id,
          producerId: consumerParams.producerId,
          kind: consumerParams.kind,
          rtpParameters: consumerParams.rtpParameters,
        });

        consumersRef.current.set(consumer.id, consumer);

        const remoteStream = new MediaStream([consumer.track]);
        if (kind === "audio") {
          setRemoteStream(peerId, { audioStream: remoteStream });
        } else {
          setRemoteStream(peerId, { videoStream: remoteStream });
        }
      } catch (e) {
        console.error("[WebRTC] consumeProducer failed:", e);
      }
    },
    [deviceRef, recvTransportRef, sendRequest, setRemoteStream]
  );

  const closeAllConsumers = useCallback(() => {
    consumersRef.current.forEach((c) => c.close());
    consumersRef.current.clear();
  }, []);

  return { consumeProducer, closeAllConsumers, consumersRef };
}
