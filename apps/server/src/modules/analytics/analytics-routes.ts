import { Elysia, t } from "elysia";
import { analyticsService } from "./analytics-service";

export const analyticsRoutes = new Elysia({ prefix: "/api/analytics" })
  /**
   * Get global dashboard analytics overview
   */
  .get(
    "/overview",
    async ({ query }) => {
      const { hostId } = query;
      const overview = await analyticsService.getGlobalOverview(hostId);
      return { success: true, overview };
    },
    {
      query: t.Object({
        hostId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Get specific meeting telemetry summary & quality metrics
   */
  .get("/meetings/:id", async ({ params, set }) => {
    const summary = await analyticsService.getMeetingSummary(params.id);
    if (!summary) {
      set.status = 404;
      return { error: "Meeting metrics not found" };
    }
    return { success: true, summary };
  })

  /**
   * Get recording statistics & storage breakdown
   */
  .get(
    "/recordings",
    async ({ query }) => {
      const { hostId } = query;
      const stats = await analyticsService.getRecordingStatistics(hostId);
      return { success: true, statistics: stats };
    },
    {
      query: t.Object({
        hostId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Ingest client WebRTC quality & network telemetry payload
   */
  .post(
    "/telemetry",
    async ({ body }) => {
      const { meetingId, userId, device, quality, network, durationSeconds, participantCount } = body;
      const tracked = await analyticsService.trackTelemetry(meetingId, userId, {
        device,
        quality,
        network,
        durationSeconds,
        participantCount,
      });

      return { success: true, tracked };
    },
    {
      body: t.Object({
        meetingId: t.String(),
        userId: t.Optional(t.String()),
        device: t.Optional(
          t.Object({
            deviceType: t.Optional(t.String()),
            browser: t.Optional(t.String()),
            os: t.Optional(t.String()),
          })
        ),
        quality: t.Optional(
          t.Object({
            audioBitrate: t.Optional(t.Number()),
            videoBitrate: t.Optional(t.Number()),
            packetLoss: t.Optional(t.Number()),
            fps: t.Optional(t.Number()),
            jitter: t.Optional(t.Number()),
            resolution: t.Optional(t.String()),
          })
        ),
        network: t.Optional(
          t.Object({
            rtt: t.Optional(t.Number()),
            bandwidth: t.Optional(t.Number()),
            transportLoss: t.Optional(t.Number()),
          })
        ),
        durationSeconds: t.Optional(t.Number()),
        participantCount: t.Optional(t.Number()),
      }),
    }
  );
