"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMeetingStore } from "../stores/meeting-store";
import { useMediaStore } from "../stores/media-store";
import { useSignalingRpc } from "./mediasoup/use-signaling-rpc";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export function useMediasoup(
  meetingId: string,
  displayName: string,
  userId?: string,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const myParticipantIdRef = useRef<string | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const { localStream, removeRemoteStream, setRemoteStream } = useMediaStore();
  const localStreamRef = useRef<MediaStream | null>(localStream);
  localStreamRef.current = localStream;

  const { addParticipant, removeParticipant, updateParticipant, setActiveSpeaker } =
    useMeetingStore();
  const { sendRequest, handleRpcResponse } = useSignalingRpc(wsRef);

  // Audio level monitoring via Web Audio API
  useEffect(() => {
    if (!localStream) return;
    try {
      const audioTrack = localStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const interval = setInterval(() => {
        if (useMediaStore.getState().isAudioMuted) return;
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const average = sum / buffer.length;
        if (average > 15) {
          if (myParticipantIdRef.current) {
            setActiveSpeaker(myParticipantIdRef.current);
          }
        }
      }, 250);

      return () => {
        clearInterval(interval);
        audioCtx.close().catch(() => {});
      };
    } catch {}
  }, [localStream, setActiveSpeaker]);

  // Create or retrieve PeerConnection for a remote peer
  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing && existing.connectionState !== "closed") {
        return existing;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(peerId, pc);

      // 1. ICE candidate discovery
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendRequest("webrtc:signal", {
            to: peerId,
            signal: { type: "candidate", candidate: event.candidate.toJSON() },
          }).catch(() => {});
        }
      };

      // 2. Incoming remote tracks
      pc.ontrack = (event) => {
        const track = event.track;
        const stream = event.streams[0] || new MediaStream([track]);

        const isScreen =
          track.label.toLowerCase().includes("screen") ||
          track.label.toLowerCase().includes("display") ||
          track.label.toLowerCase().includes("window");

        if (track.kind === "video") {
          if (isScreen) {
            setRemoteStream(peerId, { screenStream: stream });
            updateParticipant(peerId, { isScreenSharing: true });
          } else {
            setRemoteStream(peerId, { videoStream: stream });
          }
        } else if (track.kind === "audio") {
          setRemoteStream(peerId, { audioStream: stream });
        }

        track.onended = () => {
          if (isScreen) {
            setRemoteStream(peerId, { screenStream: undefined });
            updateParticipant(peerId, { isScreenSharing: false });
          }
        };
      };

      // 3. Attach local media tracks (camera + mic)
      const currentLocal = localStreamRef.current || useMediaStore.getState().localStream;
      if (currentLocal) {
        currentLocal.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, currentLocal);
          } catch {}
        });
      }

      // 4. Attach local screen track if already presenting
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
    [sendRequest, setRemoteStream, updateParticipant]
  );

  // Initiate an offer to a remote peer
  const initiatePeerConnection = useCallback(
    async (peerId: string) => {
      try {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        await sendRequest("webrtc:signal", {
          to: peerId,
          signal: { type: "offer", sdp: offer.sdp },
        });
      } catch (err) {
        console.warn("[WebRTC] initiatePeerConnection error:", err);
      }
    },
    [createPeerConnection, sendRequest]
  );

  // Toggle Audio (Mic)
  const toggleAudio = useCallback(async () => {
    const { localStream: currentStream, isAudioMuted, setAudioMuted } = useMediaStore.getState();
    const newMuted = !isAudioMuted;
    if (currentStream) {
      const audioTrack = currentStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !newMuted;
      }
    }
    setAudioMuted(newMuted);
    sendRequest("participant:updateMediaState", { isAudioMuted: newMuted }).catch(() => {});
  }, [sendRequest]);

  // Toggle Video (Camera)
  const toggleVideo = useCallback(async () => {
    const { localStream: currentStream, isVideoMuted, setVideoMuted } = useMediaStore.getState();
    const newMuted = !isVideoMuted;
    if (currentStream) {
      const videoTrack = currentStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !newMuted;
      }
    }
    setVideoMuted(newMuted);
    sendRequest("participant:updateMediaState", { isVideoMuted: newMuted }).catch(() => {});
  }, [sendRequest]);

  // Stop Screen Share
  const stopScreenShare = useCallback(async () => {
    const { screenStream, setScreenStream, setScreenSharing } = useMediaStore.getState();
    if (screenStream) {
      const screenTrack = screenStream.getVideoTracks()[0];
      if (screenTrack) {
        peerConnectionsRef.current.forEach(async (pc, peerId) => {
          try {
            const sender = pc.getSenders().find((s) => s.track === screenTrack);
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
        screenTrack.stop();
      }
    }
    setScreenStream(null);
    setScreenSharing(false);
    sendRequest("participant:updateMediaState", { isScreenSharing: false }).catch(() => {});
  }, [sendRequest]);

  // Start Screen Share
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 },
        },
        audio: true,
      });
      const { setScreenStream, setScreenSharing } = useMediaStore.getState();
      setScreenStream(stream);
      setScreenSharing(true);

      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        peerConnectionsRef.current.forEach(async (pc, peerId) => {
          try {
            pc.addTrack(screenTrack, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendRequest("webrtc:signal", {
              to: peerId,
              signal: { type: "offer", sdp: offer.sdp },
              appData: { source: "screen" },
            }).catch(() => {});
          } catch (e) {
            console.warn("[WebRTC] Renegotiate screen share failed:", e);
          }
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };
      }
      sendRequest("participant:updateMediaState", { isScreenSharing: true }).catch(() => {});
    } catch (err) {
      console.warn("[WebRTC] Start screen share cancelled or failed:", err);
    }
  }, [sendRequest, stopScreenShare]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    const { isScreenSharing } = useMediaStore.getState();
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [startScreenShare, stopScreenShare]);

  // Main WebSocket & Signaling Lifecycle
  useEffect(() => {
    if (!meetingId) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = async () => {
      try {
        const joinRes = await sendRequest("meeting:join", {
          meetingId,
          displayName,
          userId,
        });

        myParticipantIdRef.current = joinRes.participantId;

        // 1. Immediately populate existing participants
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

              // Initiate peer-to-peer WebRTC connection with this existing peer
              await initiatePeerConnection(pid);
            }
          }
        }
      } catch (err) {
        console.error("[WebRTC] Join setup failed:", err);
      }
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (handleRpcResponse(msg)) return;

      switch (msg.event) {
        case "participant:joined": {
          const pid = msg.data.id || msg.data.participantId;
          if (pid && pid !== myParticipantIdRef.current) {
            addParticipant({
              id: pid,
              meetingId,
              displayName: msg.data.displayName || "Participant",
              role: msg.data.role || "PARTICIPANT",
              isAudioMuted: msg.data.isAudioMuted ?? false,
              isVideoMuted: msg.data.isVideoMuted ?? false,
              isScreenSharing: msg.data.isScreenSharing ?? false,
              isHandRaised: msg.data.isHandRaised ?? false,
              connectionStatus: "CONNECTED",
              joinedAt: msg.data.joinedAt || new Date().toISOString(),
            });
          }
          break;
        }

        case "participant:left": {
          const pid = msg.data.participantId || msg.data.id;
          const pc = peerConnectionsRef.current.get(pid);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(pid);
          }
          removeParticipant(pid);
          removeRemoteStream(pid);
          break;
        }

        case "participant:mediaStateChanged": {
          const pid = msg.data.participantId || msg.data.id;
          updateParticipant(pid, {
            isAudioMuted: msg.data.isAudioMuted,
            isVideoMuted: msg.data.isVideoMuted,
            isScreenSharing: msg.data.isScreenSharing,
            isHandRaised: msg.data.isHandRaised,
          });
          if (msg.data.isScreenSharing === false) {
            setRemoteStream(pid, { screenStream: undefined });
          }
          break;
        }

        case "webrtc:signal": {
          const { from, signal, appData } = msg.data;
          if (!from || from === myParticipantIdRef.current) break;

          let pc = peerConnectionsRef.current.get(from);

          try {
            if (signal.type === "offer") {
              if (!pc || pc.connectionState === "closed") {
                pc = createPeerConnection(from);
              }
              await pc.setRemoteDescription(new RTCSessionDescription(signal));

              // Process any queued candidates for this peer
              const queued = iceCandidatesQueueRef.current.get(from) || [];
              for (const candidate of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              iceCandidatesQueueRef.current.delete(from);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await sendRequest("webrtc:signal", {
                to: from,
                signal: { type: "answer", sdp: answer.sdp },
                appData,
              });
            } else if (signal.type === "answer") {
              if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal));

                const queued = iceCandidatesQueueRef.current.get(from) || [];
                for (const candidate of queued) {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                iceCandidatesQueueRef.current.delete(from);
              }
            } else if (signal.type === "candidate") {
              if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } else {
                const queued = iceCandidatesQueueRef.current.get(from) || [];
                queued.push(signal.candidate);
                iceCandidatesQueueRef.current.set(from, queued);
              }
            }
          } catch (e) {
            console.warn("[WebRTC] Signal handling error:", e);
          }
          break;
        }

        case "webrtc:activeSpeaker": {
          if (msg.data.peerId) {
            setActiveSpeaker(msg.data.peerId);
          } else {
            setActiveSpeaker(null);
          }
          break;
        }
      }
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
    sendRequest,
    handleRpcResponse,
    addParticipant,
    removeParticipant,
    updateParticipant,
    removeRemoteStream,
    setRemoteStream,
    setActiveSpeaker,
    createPeerConnection,
    initiatePeerConnection,
  ]);

  return {
    sendRequest,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
  };
}
