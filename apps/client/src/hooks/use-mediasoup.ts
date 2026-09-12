"use client";

import { useEffect, useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import type { types } from "mediasoup-client";
import { useMeetingStore } from "../stores/meeting-store";
import { useMediaStore } from "../stores/media-store";
import { useSignalingRpc } from "./mediasoup/use-signaling-rpc";
import { useConsumerManager } from "./mediasoup/use-consumer-manager";
import { getVideoEncodings } from "../services/webrtc/video-encodings";
import { ConnectionRecoveryManager } from "../services/webrtc/connection-recovery";
import { AdaptiveBitrateManager } from "../services/webrtc/adaptive-bitrate";
import { getOptimalAudioConstraints } from "../services/webrtc/audio-constraints";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";

export function useMediasoup(
  meetingId: string,
  displayName: string,
  userId?: string,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<types.Device | null>(null);
  const sendTransportRef = useRef<types.Transport | null>(null);
  const recvTransportRef = useRef<types.Transport | null>(null);
  const producersRef = useRef<Map<string, types.Producer>>(new Map());
  const abrRef = useRef<AdaptiveBitrateManager | null>(null);

  const { localStream, removeRemoteStream } = useMediaStore();
  const { addParticipant, removeParticipant, setActiveSpeaker } =
    useMeetingStore();
  const { sendRequest, handleRpcResponse } = useSignalingRpc(wsRef);
  const { consumeProducer, closeAllConsumers, consumersRef } =
    useConsumerManager(deviceRef, recvTransportRef, sendRequest);

  useEffect(() => {
    if (!meetingId) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    const recovery = new ConnectionRecoveryManager(sendRequest);
    const abr = new AdaptiveBitrateManager(sendRequest);
    abrRef.current = abr;

    ws.onopen = async () => {
      try {
        const device = new mediasoupClient.Device();
        deviceRef.current = device;

        const joinRes = await sendRequest("meeting:join", {
          meetingId,
          displayName,
          userId,
        });
        if (!device.loaded) {
          await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
        }

        // 1. Send Transport
        const sendParams = await sendRequest("webrtc:createWebRtcTransport", {
          direction: "send",
        });
        const sendTransport = device.createSendTransport(sendParams);
        sendTransportRef.current = sendTransport;
        recovery.bindTransportIceRecovery(sendTransport);

        sendTransport.on("connect", async ({ dtlsParameters }, cb, err) => {
          try {
            await sendRequest("webrtc:connectWebRtcTransport", {
              transportId: sendTransport.id,
              dtlsParameters,
            });
            cb();
          } catch (e: any) {
            err(e);
          }
        });

        sendTransport.on(
          "produce",
          async ({ kind, rtpParameters, appData }, cb, err) => {
            try {
              const { id } = await sendRequest("webrtc:produce", {
                transportId: sendTransport.id,
                kind,
                rtpParameters,
                appData,
              });
              cb({ id });
            } catch (e: any) {
              err(e);
            }
          },
        );

        // 2. Recv Transport
        const recvParams = await sendRequest("webrtc:createWebRtcTransport", {
          direction: "recv",
        });
        const recvTransport = device.createRecvTransport(recvParams);
        recvTransportRef.current = recvTransport;
        recovery.bindTransportIceRecovery(recvTransport);

        recvTransport.on("connect", async ({ dtlsParameters }, cb, err) => {
          try {
            await sendRequest("webrtc:connectWebRtcTransport", {
              transportId: recvTransport.id,
              dtlsParameters,
            });
            cb();
          } catch (e: any) {
            err(e);
          }
        });

        // 3. Produce Local Audio (DSP) & Video (Simulcast / SVC)
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if (audioTrack) {
            try {
              await audioTrack.applyConstraints(getOptimalAudioConstraints());
            } catch (err) {
              console.warn(
                "[WebRTC] Could not apply DSP audio constraints:",
                err,
              );
            }
            const ap = await sendTransport.produce({
              track: audioTrack,
              appData: { source: "mic" },
            });
            producersRef.current.set("audio", ap);
          }
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            const vp = await sendTransport.produce({
              track: videoTrack,
              encodings: getVideoEncodings(),
              appData: { source: "webcam" },
            });
            producersRef.current.set("video", vp);
          }
        }

        // 4. Consume Existing Producers
        if (joinRes.existingProducers) {
          for (const item of joinRes.existingProducers) {
            consumeProducer(item.producerId, item.peerId, item.kind);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Setup failed:", err);
      }
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (handleRpcResponse(msg)) return;

      switch (msg.event) {
        case "participant:joined":
          addParticipant(msg.data);
          break;
        case "participant:left":
          removeParticipant(msg.data.participantId);
          removeRemoteStream(msg.data.participantId);
          break;
        case "webrtc:newProducer":
          consumeProducer(
            msg.data.producerId,
            msg.data.producerPeerId,
            msg.data.kind,
          );
          break;
        case "webrtc:activeSpeaker":
          setActiveSpeaker(msg.data.producerId);
          if (abrRef.current && consumersRef.current) {
            const map = new Map<
              string,
              { producerId: string; consumerId: string }
            >();
            consumersRef.current.forEach((consumer) => {
              if (consumer.kind === "video") {
                map.set(consumer.id, {
                  producerId: consumer.producerId,
                  consumerId: consumer.id,
                });
              }
            });
            abrRef.current.prioritizeActiveSpeaker(msg.data.producerId, map);
          }
          break;
      }
    };

    const cleanupNetwork = recovery.setupNetworkRecovery(() => {
      if (sendTransportRef.current && !sendTransportRef.current.closed) {
        sendRequest("webrtc:restartIce", {
          transportId: sendTransportRef.current.id,
        })
          .then(({ iceParameters }) =>
            sendTransportRef.current?.restartIce({ iceParameters }),
          )
          .catch((e) =>
            console.warn("[Recovery] Send transport ICE restart failed:", e),
          );
      }
      if (recvTransportRef.current && !recvTransportRef.current.closed) {
        sendRequest("webrtc:restartIce", {
          transportId: recvTransportRef.current.id,
        })
          .then(({ iceParameters }) =>
            recvTransportRef.current?.restartIce({ iceParameters }),
          )
          .catch((e) =>
            console.warn("[Recovery] Recv transport ICE restart failed:", e),
          );
      }
    });

    const cleanupDevice = recovery.setupDeviceHotplugRecovery(
      producersRef.current,
    );

    return () => {
      cleanupNetwork();
      cleanupDevice();
      producersRef.current.forEach((p) => p.close());
      closeAllConsumers();
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      ws.close();
    };
  }, [
    meetingId,
    displayName,
    userId,
    sendRequest,
    handleRpcResponse,
    localStream,
    addParticipant,
    removeParticipant,
    removeRemoteStream,
    setActiveSpeaker,
    consumeProducer,
    closeAllConsumers,
    consumersRef,
  ]);

  return { sendRequest };
}
