import { useMediaStore } from "../../stores/media-store";

export interface SignalContext {
  myParticipantId: string | null;
  peerConnections: Map<string, RTCPeerConnection>;
  iceCandidatesQueue: Map<string, RTCIceCandidateInit[]>;
  createPeerConnection: (id: string) => RTCPeerConnection;
  sendRequest: (method: string, data?: any) => Promise<any>;
}

export async function handleWebrtcSignal(data: any, ctx: SignalContext) {
  const { from, signal, appData } = data || {};
  if (!from || from === ctx.myParticipantId) return;
  let pc = ctx.peerConnections.get(from);
  try {
    if (signal.type === "offer") {
      if (!pc || pc.connectionState === "closed") pc = ctx.createPeerConnection(from);
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
