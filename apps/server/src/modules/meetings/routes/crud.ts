import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings } from "../../../infrastructure/database/schema";
import { generateUUIDv7, generateMeetingCode } from "@meet/shared-utils";
import { eq, desc, and } from "drizzle-orm";

export const crudRoutes = new Elysia()
  .post(
    "/",
    async ({ body, set }) => {
      const {
        title,
        description,
        type = "INSTANT",
        accessLevel = "PUBLIC",
        hostId,
        scheduledStartAt,
        scheduledEndAt,
        recurrenceRule,
        settings,
      } = body;

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
          status: type === "INSTANT" ? "ACTIVE" : "SCHEDULED",
          actualStartAt: type === "INSTANT" ? new Date() : null,
          scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
          scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null,
          recurrenceRule: recurrenceRule || null,
        })
        .returning();

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
        scheduledStartAt: t.Optional(t.String()),
        scheduledEndAt: t.Optional(t.String()),
        recurrenceRule: t.Optional(t.String()),
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
          columns: { id: true, name: true, avatarUrl: true },
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
      with: { settings: true },
      orderBy: [desc(meetings.createdAt)],
      limit: 30,
    });
    return { meetings: list };
  })
  .delete("/:id", async ({ params }) => {
    await db
      .update(meetings)
      .set({ status: "CANCELLED", deletedAt: new Date() })
      .where(eq(meetings.id, params.id));
    return { success: true };
  });
