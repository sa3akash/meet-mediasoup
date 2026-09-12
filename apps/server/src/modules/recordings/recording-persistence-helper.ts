import { redis } from "../../infrastructure/redis";
import { db } from "../../infrastructure/database";
import { meetingRecordings } from "../../infrastructure/database/schema/recordings";
import { eq } from "drizzle-orm";
import { notificationService } from "../notifications/notification-service";
import type { RecordingResult } from "./ffmpeg-recorder";

export async function finalizeRecordingPersistence(
  meetingId: string,
  session: { recordingId: string; triggeredBy?: string; recordType: string },
  result: RecordingResult
): Promise<void> {
  try {
    await redis.del(`meeting:${meetingId}:active_recording`);
    await redis.rpush(`meeting:${meetingId}:recordings_history`, JSON.stringify(result));
  } catch {}

  // Update database record to READY
  try {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (isValidUuid.test(session.recordingId)) {
      await db
        .update(meetingRecordings)
        .set({
          status: "READY",
          fileUrl: result.mp4Url,
          fileSizeBytes: result.fileSizeBytes,
          durationSeconds: result.durationSeconds,
          s3Key: `recordings/${meetingId}/${session.recordingId}.mp4`,
          updatedAt: new Date(),
        })
        .where(eq(meetingRecordings.id, session.recordingId));
    }
  } catch (dbErr) {
    console.warn("[RecordingPersistence] DB recording update notice:", (dbErr as any).message || dbErr);
  }

  // Trigger Notification for RECORDING_READY
  if (session.triggeredBy) {
    try {
      await notificationService.sendNotification({
        userId: session.triggeredBy,
        title: "Cloud Recording Ready",
        body: `Your recording for meeting ${meetingId} (${session.recordType}) is processed and ready to download.`,
        type: "RECORDING_READY",
        data: {
          meetingId,
          recordingId: session.recordingId,
          downloadUrl: result.mp4Url,
          durationSeconds: result.durationSeconds,
        },
        channels: ["IN_APP", "EMAIL", "PUSH"],
      });
    } catch (notifErr) {
      console.warn("[RecordingPersistence] Notification dispatch notice:", (notifErr as any).message || notifErr);
    }
  }
}
