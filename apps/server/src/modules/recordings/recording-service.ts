import { routerBalancer } from "../../infrastructure/mediasoup/router-balancer";
import { roomManager } from "../../infrastructure/mediasoup/room-manager";
import { FFmpegRecorder, type RecordingResult } from "./ffmpeg-recorder";
import { setupRecordingTransports, type ActiveRecordingSession } from "./recording-transport-helper";
import { finalizeRecordingPersistence } from "./recording-persistence-helper";
import type { PlainTransport, Consumer } from "mediasoup/types";
import { redis } from "../../infrastructure/redis";
import { db } from "../../infrastructure/database";
import { meetingRecordings } from "../../infrastructure/database/schema/recordings";
import { eq } from "drizzle-orm";

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
      const setup = await setupRecordingTransports(
        router,
        meetingId,
        recordType,
        ffmpegAudioPort,
        ffmpegVideoPort
      );
      audioTransport = setup.audioTransport;
      videoTransport = setup.videoTransport;
      audioConsumer = setup.audioConsumer;
      videoConsumer = setup.videoConsumer;
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

    // Persist recording session in PostgreSQL
    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(meetingId)) {
        await db.insert(meetingRecordings).values({
          id: recordingId,
          meetingId,
          triggeredBy: isValidUuid.test(triggeredBy) ? triggeredBy : undefined,
          type: "CLOUD",
          format: "MP4",
          status: "RECORDING",
        });
      }
    } catch (dbErr) {
      console.warn("[RecordingService] DB recording insert notice:", (dbErr as any).message || dbErr);
    }

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

    // Finalize redis, database update, and send notifications
    await finalizeRecordingPersistence(meetingId, session, result);

    return result;
  }


  public async getMeetingRecordings(meetingId: string): Promise<any[]> {
    try {
      const cached = await redis.lrange(`meeting:${meetingId}:recordings_history`, 0, -1);
      if (cached && cached.length > 0) {
        return cached.map((c) => JSON.parse(c));
      }
    } catch {}

    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(meetingId)) {
        const records = await db
          .select()
          .from(meetingRecordings)
          .where(eq(meetingRecordings.meetingId, meetingId));
        return records;
      }
    } catch {}

    return [];
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
