import { routerBalancer } from "../../infrastructure/mediasoup/router-balancer";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import { FFmpegRecorder, type RecordingResult } from "./ffmpeg-recorder";
import type { PlainTransport, Consumer } from "mediasoup/types";
import { redis } from "../../infrastructure/redis";

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

const activeRecordings = new Map<string, ActiveRecordingSession>(); // meetingId -> ActiveRecordingSession

export class RecordingService {
  public async startRecording(options: {
    meetingId: string;
    triggeredBy: string;
    recordType?: "COMBINED" | "AUDIO_ONLY" | "VIDEO_ONLY" | "SCREEN_ONLY";
  }): Promise<{ recordingId: string; startedAt: string; recordType: string }> {
    const { meetingId, triggeredBy } = options;
    const recordType = options.recordType || "COMBINED";

    if (activeRecordings.has(meetingId)) {
      const existing = activeRecordings.get(meetingId)!;
      return {
        recordingId: existing.recordingId,
        startedAt: existing.startedAt,
        recordType: existing.recordType,
      };
    }

    const recordingId = crypto.randomUUID();
    const ffmpegAudioPort = 5004;
    const ffmpegVideoPort = 5006;

    let audioTransport: PlainTransport | undefined;
    let videoTransport: PlainTransport | undefined;
    let audioConsumer: Consumer | undefined;
    let videoConsumer: Consumer | undefined;

    try {
      const router = await routerBalancer.getOrCreateRouter(meetingId);

      // Create plain transports on the router for audio/video recording
      if (recordType === "AUDIO_ONLY" || recordType === "COMBINED") {
        try {
          audioTransport = await router.createPlainTransport({
            listenInfo: { protocol: "udp", ip: "127.0.0.1" },
            rtcpMux: true,
            comedia: false,
          });
          await audioTransport.connect({ ip: "127.0.0.1", port: ffmpegAudioPort });
        } catch (err) {
          console.warn("[RecordingService] Audio plain transport warning:", err);
        }
      }

      if (recordType === "VIDEO_ONLY" || recordType === "SCREEN_ONLY" || recordType === "COMBINED") {
        try {
          videoTransport = await router.createPlainTransport({
            listenInfo: { protocol: "udp", ip: "127.0.0.1" },
            rtcpMux: true,
            comedia: false,
          });
          await videoTransport.connect({ ip: "127.0.0.1", port: ffmpegVideoPort });
        } catch (err) {
          console.warn("[RecordingService] Video plain transport warning:", err);
        }
      }

      // Find any existing audio & video producers in this room to consume for recording
      const producers = roomManager.getRoomProducers(meetingId);
      const audioProd = producers.find((p) => p.kind === "audio");
      const videoProd =
        recordType === "SCREEN_ONLY"
          ? producers.find((p) => p.kind === "video" && p.appData?.shareType === "screen")
          : producers.find((p) => p.kind === "video");

      if (audioTransport && audioProd) {
        try {
          audioConsumer = await audioTransport.consume({
            producerId: audioProd.producerId,
            rtpCapabilities: router.rtpCapabilities,
            paused: false,
          });
        } catch (err) {
          console.warn("[RecordingService] Audio consumer creation warning:", err);
        }
      }

      if (videoTransport && videoProd) {
        try {
          videoConsumer = await videoTransport.consume({
            producerId: videoProd.producerId,
            rtpCapabilities: router.rtpCapabilities,
            paused: false,
          });
        } catch (err) {
          console.warn("[RecordingService] Video consumer creation warning:", err);
        }
      }
    } catch (err) {
      console.warn("[RecordingService] Mediasoup router transport init warning:", err);
    }

    const hasActiveProducers = Boolean(audioConsumer || videoConsumer);

    const recorder = new FFmpegRecorder({
      meetingId,
      recordingId,
      recordType,
      audioPort: hasActiveProducers && audioConsumer ? ffmpegAudioPort : undefined,
      videoPort: hasActiveProducers && videoConsumer ? ffmpegVideoPort : undefined,
    });

    await recorder.start();

    const startedAt = new Date().toISOString();
    const session: ActiveRecordingSession = {
      recordingId,
      meetingId,
      triggeredBy,
      recordType,
      audioTransport,
      videoTransport,
      audioConsumer,
      videoConsumer,
      recorder,
      startedAt,
    };

    activeRecordings.set(meetingId, session);

    try {
      await redis.set(
        `meeting:${meetingId}:active_recording`,
        JSON.stringify({ recordingId, startedAt, recordType, triggeredBy }),
        "EX",
        86400
      );
    } catch {}

    return { recordingId, startedAt, recordType };
  }

  public async stopRecording(meetingId: string): Promise<RecordingResult | null> {
    const session = activeRecordings.get(meetingId);
    if (!session) return null;

    activeRecordings.delete(meetingId);

    // Stop and finalize FFmpeg, upload to MinIO/S3
    const result = await session.recorder.stop();

    // Close mediasoup plain transports and consumers
    try {
      session.audioConsumer?.close();
      session.videoConsumer?.close();
      session.audioTransport?.close();
      session.videoTransport?.close();
    } catch (err) {
      console.warn("[RecordingService] Clean up error:", err);
    }

    try {
      await redis.del(`meeting:${meetingId}:active_recording`);
      await redis.rpush(`meeting:${meetingId}:recordings_history`, JSON.stringify(result));
    } catch {}

    return result;
  }

  public getActiveRecording(meetingId: string): {
    recordingId: string;
    startedAt: string;
    duration: number;
    recordType: string;
  } | null {
    const session = activeRecordings.get(meetingId);
    if (!session) return null;

    return {
      recordingId: session.recordingId,
      startedAt: session.startedAt,
      duration: session.recorder.getDuration(),
      recordType: session.recordType,
    };
  }
}

export const recordingService = new RecordingService();
