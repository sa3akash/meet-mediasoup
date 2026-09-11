import { useRef, useCallback } from "react";
import type { Device, Transport, Consumer } from "mediasoup-client/lib/types";
import { useMediaStore } from "../../stores/media-store";

export function useConsumerManager(
  deviceRef: React.RefObject<Device | null>,
  recvTransportRef: React.RefObject<Transport | null>,
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
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

  return { consumeProducer, closeAllConsumers };
}
