import { useEffect } from "react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";

export function useSpeakingDetector(
  localStream: MediaStream | null,
  myParticipantIdRef: React.RefObject<string | null>,
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const { setActiveSpeaker } = useMeetingStore();

  useEffect(() => {
    if (!localStream) return;
    try {
      const audioTrack = localStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;
      let silenceCounter = 0;

      const interval = setInterval(() => {
        if (useMediaStore.getState().isAudioMuted) {
          if (wasSpeaking) {
            wasSpeaking = false;
            if (myParticipantIdRef.current) {
              if (useMeetingStore.getState().activeSpeakerId === myParticipantIdRef.current) {
                setActiveSpeaker(null);
              }
              sendRequest("participant:speaking", { isSpeaking: false }).catch(() => {});
            }
          }
          return;
        }

        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const average = sum / buffer.length;

        if (average > 8) {
          silenceCounter = 0;
          if (!wasSpeaking) {
            wasSpeaking = true;
            if (myParticipantIdRef.current) {
              setActiveSpeaker(myParticipantIdRef.current);
              sendRequest("participant:speaking", { isSpeaking: true }).catch(() => {});
            }
          }
        } else {
          if (wasSpeaking) {
            silenceCounter++;
            if (silenceCounter >= 4) {
              wasSpeaking = false;
              if (myParticipantIdRef.current) {
                if (useMeetingStore.getState().activeSpeakerId === myParticipantIdRef.current) {
                  setActiveSpeaker(null);
                }
                sendRequest("participant:speaking", { isSpeaking: false }).catch(() => {});
              }
            }
          }
        }
      }, 100);

      const myParticipantId = myParticipantIdRef.current;
      return () => {
        clearInterval(interval);
        if (wasSpeaking && myParticipantId) {
          sendRequest("participant:speaking", { isSpeaking: false }).catch(() => {});
        }
        audioCtx.close().catch(() => {});
      };
    } catch {}
  }, [localStream, sendRequest, setActiveSpeaker, myParticipantIdRef]);
}
