import { Elysia, t } from "elysia";
import { streamingService, type StreamingDestination } from "./streaming-service";
import { broadcastToRoom } from "../signaling/socket-registry";

export const streamingRoutes = new Elysia({ prefix: "/api/streaming" })
  // Get streaming status for a meeting
  .get(
    "/:meetingId",
    ({ params: { meetingId } }) => {
      const status = streamingService.getStreamStatus(meetingId);
      return { success: true, ...status };
    },
    {
      detail: {
        tags: ["Streaming"],
        summary: "Get live stream status",
        description:
          "Checks whether live streaming is active for the specified meeting and returns destination details and health.",
        responses: {
          200: {
            description: "Streaming status retrieved successfully",
          },
        },
      },
      params: t.Object({
        meetingId: t.String({ description: "Meeting room identifier or slug" }),
      }),
    }
  )
  // Start live streaming to YouTube, Facebook, or custom RTMP destinations
  .post(
    "/:meetingId/start",
    async ({ params: { meetingId }, body, set }) => {
      try {
        const { destinations, destinationUrl, streamKey, platform } = body as any;

        let destList: StreamingDestination[] = [];

        if (Array.isArray(destinations) && destinations.length > 0) {
          destList = destinations.map((d: any) => ({
            id: d.id || crypto.randomUUID(),
            platform: (d.platform || "CUSTOM_RTMP").toUpperCase(),
            rtmpUrl: d.rtmpUrl || d.destinationUrl,
            streamKey: d.streamKey || "",
          }));
        } else {
          const pUpper = (platform || "CUSTOM_RTMP").toUpperCase();
          let finalUrl = destinationUrl;
          if (pUpper.includes("YOUTUBE") && streamKey) {
            finalUrl = "rtmp://a.rtmp.youtube.com/live2";
          } else if (pUpper.includes("FACEBOOK") && streamKey) {
            finalUrl = "rtmps://live-api-s.facebook.com:443/rtmp";
          }

          if (!finalUrl) {
            set.status = 400;
            return { error: "Destination URL or Stream Key is required" };
          }

          destList = [
            {
              id: crypto.randomUUID(),
              platform: pUpper.includes("YOUTUBE")
                ? "YOUTUBE"
                : pUpper.includes("FACEBOOK")
                ? "FACEBOOK"
                : "CUSTOM_RTMP",
              rtmpUrl: finalUrl,
              streamKey: streamKey || "",
            },
          ];
        }

        const results = await streamingService.startStreaming(meetingId, destList);

        broadcastToRoom(meetingId, {
          event: "streaming:started",
          data: { streams: results, meetingId },
        });

        return { success: true, streams: results };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to start live streaming" };
      }
    },
    {
      detail: {
        tags: ["Streaming"],
        summary: "Start live streaming",
        description:
          "Launches FFmpeg RTMP/RTMPS streams for YouTube, Facebook, or custom RTMP endpoints with multi-destination support.",
        responses: {
          200: {
            description: "Streaming started successfully",
          },
          400: {
            description: "Missing destination URL or stream key",
          },
          500: {
            description: "Failed to spawn RTMP stream process",
          },
        },
      },
      params: t.Object({
        meetingId: t.String({ description: "Meeting room identifier or slug" }),
      }),
      body: t.Object(
        {
          platform: t.Optional(
            t.Union([t.Literal("YOUTUBE"), t.Literal("FACEBOOK"), t.Literal("CUSTOM_RTMP"), t.String()], {
              description: "Target platform",
            })
          ),
          destinationUrl: t.Optional(t.String({ description: "RTMP ingest URL" })),
          streamKey: t.Optional(t.String({ description: "Platform stream key" })),
          destinations: t.Optional(
            t.Array(
              t.Object({
                id: t.Optional(t.String()),
                platform: t.String({ description: "YOUTUBE | FACEBOOK | CUSTOM_RTMP" }),
                rtmpUrl: t.String({ description: "RTMP destination URL" }),
                streamKey: t.String({ description: "Secret stream key" }),
              }),
              { description: "Multiple broadcast endpoints for simultaneous multi-destination streaming" }
            )
          ),
        },
        { additionalProperties: true }
      ),
    }
  )
  // Stop live streaming (single destination or all destinations)
  .post(
    "/:meetingId/stop",
    async ({ params: { meetingId }, body }) => {
      const { destinationId } = (body as any) || {};
      const stopped = await streamingService.stopStreaming(meetingId, destinationId);

      broadcastToRoom(meetingId, {
        event: "streaming:stopped",
        data: { streamId: destinationId, meetingId },
      });

      return { success: true, stopped };
    },
    {
      detail: {
        tags: ["Streaming"],
        summary: "Stop live streaming",
        description:
          "Terminates active FFmpeg RTMP streaming child process for a specific destination or stops all active streams.",
        responses: {
          200: {
            description: "Streaming stopped successfully",
          },
        },
      },
      params: t.Object({
        meetingId: t.String({ description: "Meeting room identifier or slug" }),
      }),
      body: t.Optional(
        t.Object({
          destinationId: t.Optional(t.String({ description: "Specific destination ID to terminate. Omit to stop all." })),
        })
      ),
    }
  );
