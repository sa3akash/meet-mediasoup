import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings } from "../../../infrastructure/database/schema";
import { broadcastToRoom } from "../../signaling/socket-registry";
import { eq, or } from "drizzle-orm";

export const settingsRoutes = new Elysia()
  .patch(
    "/:id/settings",
    async ({ params, body, set }) => {
      // Find meeting by ID or Slug
      const meeting = await db.query.meetings.findFirst({
        where: or(eq(meetings.id, params.id), eq(meetings.slug, params.id)),
      });

      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }

      const existing = await db.query.meetingSettings.findFirst({
        where: eq(meetingSettings.meetingId, meeting.id),
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
        .where(eq(meetingSettings.meetingId, meeting.id))
        .returning();

      // Real-time broadcast to connected participants
      broadcastToRoom(meeting.id, { event: "meeting:settingsUpdated", data: { settings: updated } });
      broadcastToRoom(meeting.slug, { event: "meeting:settingsUpdated", data: { settings: updated } });

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
    async ({ params, body, set }) => {
      const { locked } = body;
      const meeting = await db.query.meetings.findFirst({
        where: or(eq(meetings.id, params.id), eq(meetings.slug, params.id)),
      });

      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }

      const [updated] = await db
        .update(meetingSettings)
        .set({ lockMeeting: locked, updatedAt: new Date() })
        .where(eq(meetingSettings.meetingId, meeting.id))
        .returning();

      // Broadcast lock status
      broadcastToRoom(meeting.id, { event: "meeting:settingsUpdated", data: { settings: updated } });
      broadcastToRoom(meeting.slug, { event: "meeting:settingsUpdated", data: { settings: updated } });

      return { locked: updated.lockMeeting };
    },
    {
      body: t.Object({
        locked: t.Boolean(),
      }),
    }
  )
  .post("/:id/end", async ({ params, set }) => {
    const meeting = await db.query.meetings.findFirst({
      where: or(eq(meetings.id, params.id), eq(meetings.slug, params.id)),
    });

    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }

    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        status: "ENDED",
        actualEndAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meeting.id))
      .returning();

    // Broadcast meeting ended to kick all peers
    broadcastToRoom(meeting.id, { event: "meeting:ended", data: { meetingId: meeting.id, endedBy: "HOST" } });
    broadcastToRoom(meeting.slug, { event: "meeting:ended", data: { meetingId: meeting.id, endedBy: "HOST" } });

    return { success: true, meeting: updatedMeeting };
  });
