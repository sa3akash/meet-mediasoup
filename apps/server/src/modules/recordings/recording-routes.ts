import { Elysia, t } from "elysia";
import { recordingService } from "./recording-service";
import { broadcastToRoom } from "../signaling/socket-registry";

export const recordingRoutes = new Elysia({ prefix: "/api/recordings" })
  // Get active status and history for a meeting
  .get(
    "/:meetingId",
    async ({ params: { meetingId } }) => {
      const active = recordingService.getActiveRecording(meetingId);
      const history = await recordingService.getMeetingRecordings(meetingId);
      return {
        success: true,
        isRecording: Boolean(active),
        active,
        history,
      };
    },
    {
      detail: {
        tags: ["Recordings"],
        summary: "Get meeting recordings",
        description: "Retrieves active recording status and past recordings history for a meeting room.",
      },
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  )
  // Get active recording status
  .get(
    "/:meetingId/status",
    ({ params: { meetingId } }) => {
      const status = recordingService.getActiveRecording(meetingId);
      return {
        success: true,
        isRecording: Boolean(status),
        ...status,
      };
    },
    {
      detail: {
        tags: ["Recordings"],
        summary: "Get active recording status",
      },
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  )
  // Start cloud recording
  .post(
    "/:meetingId/start",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const { recordType = "COMBINED", triggeredBy = "system" } = (body as any) || {};

        const result = await recordingService.startRecording({
          meetingId,
          triggeredBy,
          recordType,
        });

        broadcastToRoom(meetingId, {
          event: "recording:started",
          data: {
            recordingId: result.recordingId,
            startedAt: result.startedAt,
            recordType: result.recordType,
            by: triggeredBy,
          },
        });

        return { success: true, ...result };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to start cloud recording" };
      }
    },
    {
      detail: {
        tags: ["Recordings"],
        summary: "Start cloud recording",
        description: "Initiates Mediasoup PlainTransport consumer and FFmpeg recording pipeline to generate MP4 & HLS.",
      },
      params: t.Object({
        meetingId: t.String(),
      }),
      body: t.Optional(
        t.Object({
          recordType: t.Optional(t.String()),
          triggeredBy: t.Optional(t.String()),
        })
      ),
    }
  )
  // Stop cloud recording
  .post(
    "/:meetingId/stop",
    async ({ params: { meetingId }, set }) => {
      try {
        const result = await recordingService.stopRecording(meetingId);
        if (!result) {
          set.status = 404;
          return { error: "No active recording found for this meeting" };
        }

        broadcastToRoom(meetingId, {
          event: "recording:stopped",
          data: {
            recordingId: result.recordingId,
            mp4Url: result.mp4Url,
            hlsUrl: result.hlsUrl,
            durationSeconds: result.durationSeconds,
            fileSizeBytes: result.fileSizeBytes,
          },
        });

        return { success: true, ...result };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to stop recording" };
      }
    },
    {
      detail: {
        tags: ["Recordings"],
        summary: "Stop cloud recording",
        description: "Finalizes FFmpeg recording, uploads MP4/HLS to S3/MinIO, and triggers RECORDING_READY notification.",
      },
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  )
  // Get history
  .get(
    "/:meetingId/history",
    async ({ params: { meetingId } }) => {
      const history = await recordingService.getMeetingRecordings(meetingId);
      return { success: true, history };
    },
    {
      detail: {
        tags: ["Recordings"],
        summary: "Get recording history",
      },
      params: t.Object({
        meetingId: t.String(),
      }),
    }
  );
