import { useCallback } from "react";
import { useMediasoupCollabActions } from "./use-mediasoup-collab-actions";

export function useMediasoupActions(
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const collabActions = useMediasoupCollabActions(sendRequest);

  const kickParticipant = useCallback(
    async (targetParticipantId: string) =>
      sendRequest("participant:kick", { targetParticipantId }),
    [sendRequest]
  );

  const controlParticipantMedia = useCallback(
    async (targetParticipantId: string, mediaType: "audio" | "video", muted: boolean) =>
      sendRequest("participant:controlMedia", { targetParticipantId, mediaType, muted }),
    [sendRequest]
  );

  const muteAllParticipants = useCallback(
    async () => sendRequest("participant:muteAll", {}),
    [sendRequest]
  );

  const promoteParticipant = useCallback(
    async (targetParticipantId: string, targetRole: "CO_HOST" | "PARTICIPANT") =>
      sendRequest("participant:setRole", { targetParticipantId, role: targetRole }),
    [sendRequest]
  );

  const spotlightParticipant = useCallback(
    async (targetParticipantId: string | null) =>
      sendRequest("participant:spotlight", { targetParticipantId }),
    [sendRequest]
  );

  const startCloudRecording = useCallback(
    async (
      recordType: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY" = "COMBINED"
    ) => sendRequest("recording:start", { recordType }),
    [sendRequest]
  );

  const stopCloudRecording = useCallback(
    async () => sendRequest("recording:stop", {}),
    [sendRequest]
  );

  const startLiveStream = useCallback(
    async (params: {
      platform?: string;
      destinationUrl?: string;
      streamKey?: string;
      destinations?: any[];
    }) => sendRequest("streaming:start", params),
    [sendRequest]
  );

  const stopLiveStream = useCallback(
    async (destinationId?: string) =>
      sendRequest("streaming:stop", { destinationId, streamId: destinationId }),
    [sendRequest]
  );

  const getLiveStreamStatus = useCallback(
    async () => sendRequest("streaming:status", {}),
    [sendRequest]
  );

  return {
    kickParticipant,
    controlParticipantMedia,
    muteAllParticipants,
    promoteParticipant,
    spotlightParticipant,
    startCloudRecording,
    stopCloudRecording,
    startLiveStream,
    stopLiveStream,
    getLiveStreamStatus,
    ...collabActions,
  };
}
