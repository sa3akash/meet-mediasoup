export type LocalRecordingType = "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY";

export interface LocalRecorderOptions {
  recordType: LocalRecordingType;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Map<
    string,
    { audioStream?: MediaStream; videoStream?: MediaStream; screenStream?: MediaStream; stream?: MediaStream } | any
  >;
  meetingTitle?: string;
  onDurationUpdate?: (seconds: number) => void;
  onStop?: (downloadUrl: string, blob: Blob) => void;
}

export function getSupportedMimeType(isAudioOnly: boolean): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  const audioTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  const videoTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=avc1,mp4a",
    "video/mp4",
  ];

  const candidates = isAudioOnly ? audioTypes : videoTypes;
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "";
}

export async function createMixedAudioStream(
  localStream: MediaStream | null,
  remoteStreams: Map<string, any>,
  audioContextRef: { current: AudioContext | null }
): Promise<MediaStream> {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => {});
    }

    const dest = ctx.createMediaStreamDestination();

    const silentOsc = ctx.createOscillator();
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0.0001;
    silentOsc.connect(silentGain);
    silentGain.connect(dest);
    silentOsc.start();

    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        try {
          const src = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
          src.connect(dest);
        } catch {}
      }
    }

    remoteStreams.forEach((peer: any) => {
      const audioStream = peer.audioStream || peer.stream;
      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const src = ctx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
            src.connect(dest);
          } catch {}
        }
      }
    });

    return dest.stream;
  } catch {
    return localStream || new MediaStream();
  }
}
