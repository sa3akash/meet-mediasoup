"use client";

import { useEffect, useRef, useCallback } from "react";
import * as mediasoupClient from "mediasoup-client";
import type { Device, Transport, Producer, Consumer } from "mediasoup-client/lib/types";
import { useMeetingStore } from "../stores/meeting-store";
import { useMediaStore } from "../stores/media-store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";

export function useMediasoup(meetingId: string, displayName: string, userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  const { localStream, setRemoteStream, removeRemoteStream } = useMediaStore();
  const { addParticipant, removeParticipant, setActiveSpeaker } = useMeetingStore();

  // Send JSON-RPC request over native WebSocket
  const sendRequest = useCallback((method: string, data: any = {}): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket not open"));
      }
      const id = crypto.randomUUID();
      pendingRequests.current.set(id, { resolve, reject });
      wsRef.current.send(JSON.stringify({ id, method, data }));
    });
  }, []);

  // Connect to native WebSocket and initialize Mediasoup
  useEffect(() => {
    if (!meetingId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log("[WebRTC] Connected to signaling gateway");
      try {
        const device = new mediasoupClient.Device();
        deviceRef.current = device;

        // Join room and negotiate router RTP capabilities
        const joinRes = await sendRequest("meeting:join", {
          meetingId,
          displayName,
          userId,
        });

        if (!device.loaded) {
          await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
        }

        // 1. Create WebRTC Send Transport
        const sendTransportParams = await sendRequest("webrtc:createWebRtcTransport", {
          direction: "send",
        });

        const sendTransport = device.createSendTransport(sendTransportParams);
        sendTransportRef.current = sendTransport;

        sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
          try {
            await sendRequest("webrtc:connectWebRtcTransport", {
              transportId: sendTransport.id,
              dtlsParameters,
            });
            callback();
          } catch (e: any) {
            errback(e);
          }
        });

        sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
          try {
            const { id } = await sendRequest("webrtc:produce", {
              transportId: sendTransport.id,
              kind,
              rtpParameters,
              appData,
            });
            callback({ id });
          } catch (e: any) {
            errback(e);
          }
        });

        // 2. Create WebRTC Recv Transport
        const recvTransportParams = await sendRequest("webrtc:createWebRtcTransport", {
          direction: "recv",
        });

        const recvTransport = device.createRecvTransport(recvTransportParams);
        recvTransportRef.current = recvTransport;

        recvTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
          try {
            await sendRequest("webrtc:connectWebRtcTransport", {
              transportId: recvTransport.id,
              dtlsParameters,
            });
            callback();
          } catch (e: any) {
            errback(e);
          }
        });

        // 3. Produce Local Audio & Video if stream exists
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          if (audioTrack) {
            const audioProducer = await sendTransport.produce({
              track: audioTrack,
              appData: { source: "mic" },
            });
            producersRef.current.set("audio", audioProducer);
          }

          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            const videoProducer = await sendTransport.produce({
              track: videoTrack,
              encodings: [
                { maxBitrate: 200000, scaleResolutionDownBy: 4 }, // Low: 240p
                { maxBitrate: 800000, scaleResolutionDownBy: 2 }, // Med: 480p
                { maxBitrate: 2500000, scaleResolutionDownBy: 1 }, // High: 720p/1080p
              ],
              codecOptions: {
                videoGoogleStartBitrate: 1000,
              },
              appData: { source: "webcam" },
            });
            producersRef.current.set("video", videoProducer);
          }
        }

        // 4. Consume any existing producers in the room
        if (joinRes.existingProducers) {
          for (const item of joinRes.existingProducers) {
            consumeProducer(item.producerId, item.peerId, item.kind);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Initialization error:", err);
      }
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      // Handle RPC response
      if (msg.id && pendingRequests.current.has(msg.id)) {
        const { resolve, reject } = pendingRequests.current.get(msg.id)!;
        pendingRequests.current.delete(msg.id);
        if (msg.ok) resolve(msg.data);
        else reject(new Error(msg.error?.message || "RPC Error"));
        return;
      }

      // Handle Signaling Broadcast Events
      switch (msg.event) {
        case "participant:joined":
          addParticipant(msg.data);
          break;

        case "participant:left":
          removeParticipant(msg.data.participantId);
          removeRemoteStream(msg.data.participantId);
          break;

        case "webrtc:newProducer":
          consumeProducer(msg.data.producerId, msg.data.producerPeerId, msg.data.kind);
          break;

        case "webrtc:activeSpeaker":
          setActiveSpeaker(msg.data.producerId);
          break;
      }
    };

    const consumeProducer = async (producerId: string, peerId: string, kind: "audio" | "video") => {
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
    };

    return () => {
      // Teardown
      producersRef.current.forEach((p) => p.close());
      consumersRef.current.forEach((c) => c.close());
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      ws.close();
    };
  }, [meetingId, displayName, userId, sendRequest, localStream, addParticipant, removeParticipant, setRemoteStream, removeRemoteStream, setActiveSpeaker]);

  return { sendRequest };
}
