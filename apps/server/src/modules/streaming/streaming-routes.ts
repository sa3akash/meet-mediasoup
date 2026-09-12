import { Elysia, t } from "elysia";
import { streamingService } from "./streaming-service";
import { apiDoc, SwaggerTags } from "../../infrastructure/swagger/swagger-helpers";

export const streamingRoutes = new Elysia({ prefix: "/api/streaming" })
  /**
   * Get configured streaming destinations for a meeting
   */
  .get(
    "/:meetingId/destinations",
    async ({ params: { meetingId } }) => {
      const destinations = streamingService.getDestinations(meetingId);
      return { success: true, destinations };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.STREAMING,
        summary: "Get stream destinations",
        description: "Retrieves RTMP destinations configured for this meeting.",
      }),
      params: t.Object({ meetingId: t.String() }),
    }
  )

  /**
   * Add a streaming destination (YouTube, Facebook, RTMP)
   */
  .post(
    "/:meetingId/destinations",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const dest = await streamingService.addDestination(meetingId, {
          platform: body.platform as any,
          rtmpUrl: body.rtmpUrl,
          streamKey: body.streamKey,
          name: body.name,
        });
        return { success: true, destination: dest };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to add destination" };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.STREAMING,
        summary: "Add stream destination",
        description: "Adds an RTMP destination endpoint (YouTube, Facebook, or custom RTMP).",
      }),
      params: t.Object({ meetingId: t.String() }),
      body: t.Object({
        platform: t.Union([
          t.Literal("YOUTUBE"),
          t.Literal("FACEBOOK"),
          t.Literal("CUSTOM_RTMP"),
        ]),
        rtmpUrl: t.String(),
        streamKey: t.String(),
        name: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Remove a streaming destination
   */
  .delete(
    "/:meetingId/destinations/:destinationId",
    async ({ params: { meetingId, destinationId } }) => {
      const success = await streamingService.removeDestination(meetingId, destinationId);
      return { success };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.STREAMING,
        summary: "Remove stream destination",
        description: "Deletes a configured streaming destination.",
      }),
      params: t.Object({ meetingId: t.String(), destinationId: t.String() }),
    }
  )

  /**
   * Start live streaming
   */
  .post(
    "/:meetingId/start",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const result = await streamingService.startStreaming(meetingId, body?.destinationIds);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to start streaming" };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.STREAMING,
        summary: "Start live streaming",
        description: "Launches FFmpeg processing and pipes audio/video to destinations.",
      }),
      params: t.Object({ meetingId: t.String() }),
      body: t.Optional(
        t.Object({ destinationIds: t.Optional(t.Array(t.String())) })
      ),
    }
  )

  /**
   * Stop live streaming
   */
  .post(
    "/:meetingId/stop",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const result = await streamingService.stopStreaming(meetingId, body?.destinationId);
        return { success: true, ...result };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to stop streaming" };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.STREAMING,
        summary: "Stop live streaming",
        description: "Terminates active FFmpeg broadcast workers.",
      }),
      params: t.Object({ meetingId: t.String() }),
      body: t.Optional(
        t.Object({ destinationId: t.Optional(t.String()) })
      ),
    }
  )

  /**
   * Get streaming history
   */
  .get(
    "/:meetingId/history",
    async ({ params: { meetingId } }) => {
      const history = await streamingService.getMeetingStreamHistory(meetingId);
      return { success: true, history };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.STREAMING,
        summary: "Get stream history",
        description: "Retrieves past streaming session records.",
      }),
      params: t.Object({ meetingId: t.String() }),
    }
  );
