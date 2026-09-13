import { useMediaStore } from "../../stores/media-store";
import { useMeetingStore } from "../../stores/meeting-store";

export interface SignalContext {
  myParticipantId: string | null;
  peerConnections: Map<string, RTCPeerConnection>;
  iceCandidatesQueue: Map<string, RTCIceCandidateInit[]>;
  remoteScreenTrackIds?: Map<string, Set<string>>;
  remoteScreenStreamIds?: Map<string, Set<string>>;
  createPeerConnection: (id: string) => RTCPeerConnection;
  sendRequest: (method: string, data?: any) => Promise<any>;
}

export async function handleWebrtcSignal(data: any, ctx: SignalContext) {
  const { from, signal, appData } = data || {};
  if (!from || from === ctx.myParticipantId) return;

  if (appData?.source === "screen" || appData?.screenTrackId || appData?.screenStreamId) {
    if (appData.screenTrackId && ctx.remoteScreenTrackIds) {
      let s = ctx.remoteScreenTrackIds.get(from);
      if (!s) { s = new Set(); ctx.remoteScreenTrackIds.set(from, s); }
      s.add(appData.screenTrackId);
    }
    if (appData.screenStreamId && ctx.remoteScreenStreamIds) {
      let s = ctx.remoteScreenStreamIds.get(from);
      if (!s) { s = new Set(); ctx.remoteScreenStreamIds.set(from, s); }
      s.add(appData.screenStreamId);
    }
    useMeetingStore.getState().updateParticipant(from, { isScreenSharing: true });
  } else if (appData?.source === "screen-stopped") {
    useMediaStore.getState().setRemoteStream(from, { screenStream: undefined });
    useMeetingStore.getState().updateParticipant(from, { isScreenSharing: false });
    ctx.remoteScreenTrackIds?.delete(from);
    ctx.remoteScreenStreamIds?.delete(from);
  }

  let pc = ctx.peerConnections.get(from);
  try {
    if (signal.type === "offer") {
      if (!pc || pc.connectionState === "closed") pc = ctx.createPeerConnection(from);

      const currentLocal = useMediaStore.getState().localStream;
      if (currentLocal) {
        const senders = pc.getSenders();
        currentLocal.getTracks().forEach((track) => {
          const already = senders.some((s) => s.track === track || (s.track && s.track.kind === track.kind));
          if (!already) {
            try { pc!.addTrack(track, currentLocal); } catch {}
          }
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const queued = ctx.iceCandidatesQueue.get(from) || [];
      for (const candidate of queued) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      ctx.iceCandidatesQueue.delete(from);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const currentScreen = useMediaStore.getState().screenStream;
      const screenTrack = currentScreen?.getVideoTracks()[0];
      await ctx.sendRequest("webrtc:signal", {
        to: from,
        signal: { type: "answer", sdp: answer.sdp },
        appData: currentScreen
          ? { source: "screen", screenTrackId: screenTrack?.id, screenStreamId: currentScreen.id }
          : appData,
      });
    } else if (signal.type === "answer") {
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const queued = ctx.iceCandidatesQueue.get(from) || [];
        for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c));
        ctx.iceCandidatesQueue.delete(from);
      }
    } else if (signal.type === "candidate") {
      if (pc?.remoteDescription?.type) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      else {
        const q = ctx.iceCandidatesQueue.get(from) || [];
        q.push(signal.candidate);
        ctx.iceCandidatesQueue.set(from, q);
      }
    }
  } catch (e) {
    console.warn("[WebRTC] Signal handling error:", e);
  }
}
