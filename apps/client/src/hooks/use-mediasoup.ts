/* eslint-disable react-hooks/refs */
"use client";

import { useEffect, useRef } from "react";
import { useMeetingStore } from "../stores/meeting-store";
import { useMediaStore } from "../stores/media-store";
import { useSignalingRpc } from "./mediasoup/use-signaling-rpc";
import { WS_URL, type UseMediasoupCallbacks } from "./mediasoup/mediasoup-types";
import { useSpeakingDetector } from "./mediasoup/use-speaking-detector";
import { useMediasoupActions } from "./mediasoup/use-mediasoup-actions";
import { useMediasoupProducers } from "./mediasoup/use-mediasoup-producers";
import { useMediasoupTransports } from "./mediasoup/use-mediasoup-transports";
import { createMediasoupEventHandler } from "./mediasoup/use-mediasoup-events";

export * from "./mediasoup/mediasoup-types";

export function useMediasoup(
  meetingId: string,
  displayName: string,
  userId?: string,
  callbacks?: UseMediasoupCallbacks,
  role: "HOST" | "CO_HOST" | "PARTICIPANT" = "PARTICIPANT"
) {
  const wsRef = useRef<WebSocket | null>(null);
  const myParticipantIdRef = useRef<string | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteScreenTrackIdsRef = useRef<Map<string, Set<string>>>(new Map());
  const remoteScreenStreamIdsRef = useRef<Map<string, Set<string>>>(new Map());

  const callbacksRef = useRef<UseMediasoupCallbacks>(callbacks || {});
  callbacksRef.current = callbacks || {};

  const { localStream } = useMediaStore();
  const localStreamRef = useRef<MediaStream | null>(localStream);
  localStreamRef.current = localStream;

  const { addParticipant, setMyParticipantId, setMyRole } = useMeetingStore();
  const { sendRequest, handleRpcResponse } = useSignalingRpc(wsRef);

  useSpeakingDetector(localStream, myParticipantIdRef, sendRequest);

  const actions = useMediasoupActions(sendRequest);
  const producers = useMediasoupProducers(peerConnectionsRef, sendRequest);
  const { createPeerConnection, initiatePeerConnection } = useMediasoupTransports(
    peerConnectionsRef,
    remoteScreenTrackIdsRef,
    remoteScreenStreamIdsRef,
    localStreamRef,
    sendRequest
  );

  useEffect(() => {
    if (!meetingId) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        const joinRes = await sendRequest("meeting:join", { meetingId, displayName, userId, role });
        myParticipantIdRef.current = joinRes.participantId;
        setMyParticipantId(joinRes.participantId);
        if (joinRes.role) setMyRole(joinRes.role);

        if (joinRes.existingParticipants && Array.isArray(joinRes.existingParticipants)) {
          for (const p of joinRes.existingParticipants) {
            const pid = p.id || p.participantId;
            if (pid && pid !== myParticipantIdRef.current) {
              addParticipant({
                id: pid,
                meetingId,
                displayName: p.displayName || "Participant",
                role: p.role || "PARTICIPANT",
                isAudioMuted: p.isAudioMuted ?? false,
                isVideoMuted: p.isVideoMuted ?? false,
                isScreenSharing: p.isScreenSharing ?? false,
                isHandRaised: p.isHandRaised ?? false,
                connectionStatus: "CONNECTED",
                joinedAt: p.joinedAt || new Date().toISOString(),
              });
              await initiatePeerConnection(pid);
            }
          }
        }
        if (joinRes.chatHistory) callbacksRef.current.onChatHistory?.(joinRes.chatHistory);
        if (joinRes.activeRecording) callbacksRef.current.onRecordingStarted?.(joinRes.activeRecording);
      } catch (err) {
        console.error("[WebRTC] Join setup failed:", err);
      }
    };

    const handleEvent = createMediasoupEventHandler(
      callbacksRef.current,
      myParticipantIdRef,
      peerConnectionsRef,
      iceCandidatesQueueRef,
      remoteScreenTrackIdsRef,
      remoteScreenStreamIdsRef,
      createPeerConnection,
      sendRequest,
      meetingId
    );

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (handleRpcResponse(msg)) return;
      await handleEvent(msg);
    };

    return () => {
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      iceCandidatesQueueRef.current.clear();
      ws.close();
    };
  }, [
    meetingId,
    displayName,
    userId,
    role,
    sendRequest,
    handleRpcResponse,
    addParticipant,
    setMyParticipantId,
    setMyRole,
    createPeerConnection,
    initiatePeerConnection,
  ]);

  return {
    sendRequest,
    ...producers,
    ...actions,
  };
}
