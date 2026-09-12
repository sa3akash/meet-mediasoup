import type { PlainTransport, Consumer, Router } from "mediasoup/types";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import type { FFmpegRecorder } from "./ffmpeg-recorder";

export interface ActiveRecordingSession {
  recordingId: string;
  meetingId: string;
  triggeredBy: string;
  recordType: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY";
  audioTransport?: PlainTransport;
  videoTransport?: PlainTransport;
  audioConsumer?: Consumer;
  videoConsumer?: Consumer;
  recorder: FFmpegRecorder;
  startedAt: string;
}

export interface TransportSetupResult {
  audioTransport?: PlainTransport;
  videoTransport?: PlainTransport;
  audioConsumer?: Consumer;
  videoConsumer?: Consumer;
}


export async function setupRecordingTransports(
  router: Router,
  meetingId: string,
  recordType: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY",
  audioPort: number = 5004,
  videoPort: number = 5006
): Promise<TransportSetupResult> {
  let audioTransport: PlainTransport | undefined;
  let videoTransport: PlainTransport | undefined;
  let audioConsumer: Consumer | undefined;
  let videoConsumer: Consumer | undefined;

  // Create plain transport for audio
  if ((recordType === "AUDIO_ONLY" || recordType === "COMBINED") && typeof router.createPlainTransport === "function") {
    try {
      audioTransport = await router.createPlainTransport({
        listenInfo: { protocol: "udp", ip: "127.0.0.1" },
        rtcpMux: true,
        comedia: false,
      });
      await audioTransport.connect({ ip: "127.0.0.1", port: audioPort });

      const producers = roomManager.getRoomProducers(meetingId);
      const audioProducer = producers.find((p) => p.kind === "audio");
      if (audioProducer) {
        audioConsumer = await audioTransport.consume({
          producerId: audioProducer.producerId,
          rtpCapabilities: router.rtpCapabilities,
          paused: false,
        });
      }
    } catch (err) {
      console.warn("[RecordingTransport] Audio transport setup note:", err);
    }
  }

  // Create plain transport for video / screen
  if (recordType !== "AUDIO_ONLY" && typeof router.createPlainTransport === "function") {
    try {
      videoTransport = await router.createPlainTransport({
        listenInfo: { protocol: "udp", ip: "127.0.0.1" },
        rtcpMux: true,
        comedia: false,
      });
      await videoTransport.connect({ ip: "127.0.0.1", port: videoPort });

      const producers = roomManager.getRoomProducers(meetingId);
      const videoProducer =
        recordType === "SCREEN_ONLY"
          ? producers.find((p) => p.appData?.shareType === "screen") || producers.find((p) => p.kind === "video")
          : producers.find((p) => p.kind === "video");

      if (videoProducer) {
        videoConsumer = await videoTransport.consume({
          producerId: videoProducer.producerId,
          rtpCapabilities: router.rtpCapabilities,
          paused: false,
        });
      }

    } catch (err) {
      console.warn("[RecordingTransport] Video transport setup note:", err);
    }
  }

  return {
    audioTransport,
    videoTransport,
    audioConsumer,
    videoConsumer,
  };
}
