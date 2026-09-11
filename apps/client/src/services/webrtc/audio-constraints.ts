export interface AudioDspOptions {
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
}

export function getOptimalAudioConstraints(options: AudioDspOptions = {}): MediaTrackConstraints {
  return {
    echoCancellation: options.echoCancellation ?? true,
    noiseSuppression: options.noiseSuppression ?? true,
    autoGainControl: options.autoGainControl ?? true,
    channelCount: 2,
    sampleRate: 48000,
    sampleSize: 16,
  };
}

export async function createProcessedAudioTrack(options: AudioDspOptions = {}): Promise<MediaStreamTrack> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: getOptimalAudioConstraints(options),
    video: false,
  });
  return stream.getAudioTracks()[0];
}
