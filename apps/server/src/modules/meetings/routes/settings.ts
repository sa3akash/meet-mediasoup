import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";

export const settingsRoutes = new Elysia()
  .patch(
    "/:id/settings",
    async ({ params, body, set }) => {
      const existing = await db.query.meetingSettings.findFirst({
        where: eq(meetingSettings.meetingId, params.id),
      });

      if (!existing) {
        set.status = 404;
        return { error: "Meeting settings not found" };
      }

      const [updated] = await db
        .update(meetingSettings)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(meetingSettings.meetingId, params.id))
        .returning();

      return { settings: updated };
    },
    {
      body: t.Object({
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
      }),
    }
  )
  .post(
    "/:id/lock",
    async ({ params, body }) => {
      const { locked } = body;
      const [updated] = await db
        .update(meetingSettings)
        .set({ lockMeeting: locked, updatedAt: new Date() })
        .where(eq(meetingSettings.meetingId, params.id))
        .returning();

      return { locked: updated.lockMeeting };
    },
    {
      body: t.Object({
        locked: t.Boolean(),
      }),
    }
  )
  .post("/:id/end", async ({ params }) => {
    const [meeting] = await db
      .update(meetings)
      .set({
        status: "ENDED",
        actualEndAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, params.id))
      .returning();

    return { success: true, meeting };
  });
