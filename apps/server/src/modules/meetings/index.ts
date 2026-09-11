import { Elysia, t } from "elysia";
import { db } from "../../infrastructure/database";
import { meetings, meetingSettings, meetingParticipants } from "../../infrastructure/database/schema";
import { generateUUIDv7, generateMeetingCode } from "@meet/shared-utils";
import { eq, and, desc } from "drizzle-orm";

export const meetingRoutes = new Elysia({ prefix: "/api/meetings" })
  .post(
    "/",
    async ({ body, set }) => {
      const { title, description, type = "INSTANT", accessLevel = "PUBLIC", hostId, settings } = body;
      const meetingId = generateUUIDv7();
      const slug = generateMeetingCode();

      const [newMeeting] = await db
        .insert(meetings)
        .values({
          id: meetingId,
          hostId,
          title,
          description: description || null,
          slug,
          type,
          accessLevel,
          status: "SCHEDULED",
        })
        .returning();

      // Create default or custom meeting settings
      await db.insert(meetingSettings).values({
        id: generateUUIDv7(),
        meetingId: newMeeting.id,
        waitingRoomEnabled: settings?.waitingRoomEnabled ?? false,
        autoRecording: settings?.autoRecording ?? false,
        muteOnJoin: settings?.muteOnJoin ?? true,
        cameraOffOnJoin: settings?.cameraOffOnJoin ?? false,
        disableScreenShare: settings?.disableScreenShare ?? false,
        disableChat: settings?.disableChat ?? false,
        disableFileShare: settings?.disableFileShare ?? false,
        disableReactions: settings?.disableReactions ?? false,
        lockMeeting: settings?.lockMeeting ?? false,
        allowGuestUsers: settings?.allowGuestUsers ?? true,
        maxParticipants: settings?.maxParticipants ?? 100,
      });

      return {
        meeting: newMeeting,
        joinUrl: `/meeting/${newMeeting.slug}`,
      };
    },
    {
      body: t.Object({
        hostId: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        accessLevel: t.Optional(t.String()),
        settings: t.Optional(
          t.Object({
            waitingRoomEnabled: t.Optional(t.Boolean()),
            autoRecording: t.Optional(t.Boolean()),
            muteOnJoin: t.Optional(t.Boolean()),
            cameraOffOnJoin: t.Optional(t.Boolean()),
            disableScreenShare: t.Optional(t.Boolean()),
            disableChat: t.Optional(t.Boolean()),
            disableFileShare: t.Optional(t.Boolean()),
            disableReactions: t.Optional(t.Boolean()),
            lockMeeting: t.Optional(t.Boolean()),
            allowGuestUsers: t.Optional(t.Boolean()),
            maxParticipants: t.Optional(t.Number()),
          })
        ),
      }),
    }
  )
  .get("/code/:slug", async ({ params, set }) => {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.slug, params.slug),
      with: {
        settings: true,
        host: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }

    return { meeting };
  })
  .get("/user/:userId", async ({ params }) => {
    const list = await db.query.meetings.findMany({
      where: eq(meetings.hostId, params.userId),
      orderBy: [desc(meetings.createdAt)],
      limit: 20,
    });
    return { meetings: list };
  });
