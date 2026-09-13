import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { handleWebrtcSignal } from "./mediasoup-signal-handler";
import { handleCollabEvent } from "./mediasoup-collab-events";

export function createMediasoupEventHandler(
  callbacksRef: { [key: string]: any },
  myParticipantIdRef: React.RefObject<string | null>,
  peerConnectionsRef: React.RefObject<Map<string, RTCPeerConnection>>,
  iceCandidatesQueueRef: React.RefObject<Map<string, RTCIceCandidateInit[]>>,
  remoteScreenTrackIdsRef: React.RefObject<Map<string, Set<string>>>,
  remoteScreenStreamIdsRef: React.RefObject<Map<string, Set<string>>>,
  createPeerConnection: (id: string) => RTCPeerConnection,
  sendRequest: (method: string, data?: any) => Promise<any>,
  meetingId: string
) {
  const {
    addParticipant,
    removeParticipant,
    updateParticipant,
    setActiveSpeaker,
    setSpotlightParticipant,
    setMyRole,
  } = useMeetingStore.getState();

  const { removeRemoteStream, setRemoteStream } = useMediaStore.getState();

  return async (msg: any) => {
    if (handleCollabEvent(msg, callbacksRef)) return;

    switch (msg.event) {
      case "meeting:ended":
        callbacksRef.onMeetingEnded?.();
        break;
      case "participant:kicked":
        callbacksRef.onKicked?.(msg.data?.reason || "You were removed by the host.");
        break;
      case "participant:forceMediaState": {
        const { mediaType, muted, by, reason } = msg.data || {};
        if (muted) {
          const { localStream, setAudioMuted, setVideoMuted } = useMediaStore.getState();
          if (mediaType === "audio") {
            localStream?.getAudioTracks()[0] && (localStream.getAudioTracks()[0].enabled = false);
            setAudioMuted(true);
            sendRequest("participant:updateMediaState", { isAudioMuted: true }).catch(() => {});
          } else if (mediaType === "video") {
            localStream?.getVideoTracks()[0] && (localStream.getVideoTracks()[0].enabled = false);
            setVideoMuted(true);
            sendRequest("participant:updateMediaState", { isVideoMuted: true }).catch(() => {});
          }
        }
        callbacksRef.onMediaForced?.({ mediaType, muted, by, reason });
        break;
      }
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
        const pc = peerConnectionsRef.current?.get(pid);
        if (pc) {
          pc.close();
          peerConnectionsRef.current?.delete(pid);
        }
        removeParticipant(pid);
        removeRemoteStream(pid);
        break;
      }
      case "participant:mediaStateChanged": {
        const pid = msg.data.participantId || msg.data.id;
        if (pid && pid !== myParticipantIdRef.current) {
          updateParticipant(pid, {
            isAudioMuted: msg.data.isAudioMuted,
            isVideoMuted: msg.data.isVideoMuted,
            isScreenSharing: msg.data.isScreenSharing,
            isHandRaised: msg.data.isHandRaised,
          });
          if (msg.data.isScreenSharing === false) {
            setRemoteStream(pid, { screenStream: undefined });
            remoteScreenTrackIdsRef.current?.delete(pid);
            remoteScreenStreamIdsRef.current?.delete(pid);
          }
        }
        break;
      }
      case "webrtc:signal":
        await handleWebrtcSignal(msg.data, {
          myParticipantId: myParticipantIdRef.current,
          peerConnections: peerConnectionsRef.current!,
          iceCandidatesQueue: iceCandidatesQueueRef.current!,
          remoteScreenTrackIds: remoteScreenTrackIdsRef.current!,
          remoteScreenStreamIds: remoteScreenStreamIdsRef.current!,
          createPeerConnection,
          sendRequest,
        });
        break;
      case "webrtc:activeSpeaker":
        setActiveSpeaker(msg.data?.peerId || null);
        break;
      case "participant:roleChanged": {
        const { participantId, role: newRole } = msg.data || {};
        if (participantId === myParticipantIdRef.current) setMyRole(newRole);
        else updateParticipant(participantId, { role: newRole });
        callbacksRef.onRoleChanged?.(participantId, newRole);
        break;
      }
      case "participant:spotlighted":
        setSpotlightParticipant(msg.data?.participantId || null);
        callbacksRef.onSpotlighted?.(msg.data?.participantId || null);
        break;
    }
  };
}
