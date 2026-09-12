import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings } from "../../../infrastructure/database/schema";
import { broadcastToRoom } from "../../signaling/socket-registry";
import { eq } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";
import { findMeeting } from "../services/meeting-query-helper";

export const controlsRoutes = new Elysia()
  /**
   * Lock or unlock meeting
   */
  .post(
    "/:id/lock",
    async ({ params, body, set }) => {
      const { locked } = body;
      const meeting = await findMeeting(params.id);

      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }

      const [updated] = await db
        .update(meetingSettings)
        .set({ lockMeeting: locked, updatedAt: new Date() })
        .where(eq(meetingSettings.meetingId, meeting.id))
        .returning();

      broadcastToRoom(meeting.id, { event: "meeting:settingsUpdated", data: { settings: updated } });
      broadcastToRoom(meeting.slug, { event: "meeting:settingsUpdated", data: { settings: updated } });

      return { locked: updated.lockMeeting };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Lock or unlock meeting",
        description: "Prevents new participants from joining when locked.",
      }),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        locked: t.Boolean(),
      }),
    }
  )

  /**
   * End meeting for all participants
   */
  .post(
    "/:id/end",
    async ({ params, set }) => {
      const meeting = await findMeeting(params.id);
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

      broadcastToRoom(meeting.id, { event: "meeting:ended", data: { meetingId: meeting.id, endedBy: "HOST" } });
      broadcastToRoom(meeting.slug, { event: "meeting:ended", data: { meetingId: meeting.id, endedBy: "HOST" } });

      return { success: true, meeting: updatedMeeting };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "End meeting for all",
        description: "Ends meeting session and disconnects all participants.",
      }),
      params: t.Object({ id: t.String() }),
    }
  )

  /**
   * Set or remove room passcode
   */
  .patch(
    "/:id/passcode",
    async ({ params, body, set }) => {
      const { passcode } = body as any;
      const meeting = await findMeeting(params.id);

      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }

      const trimmedPasscode = typeof passcode === "string" ? passcode.trim() : "";
      const accessLevel = trimmedPasscode.length > 0 ? "PRIVATE" : "PUBLIC";

      const [updated] = await db
        .update(meetings)
        .set({
          passcode: trimmedPasscode.length > 0 ? trimmedPasscode : null,
          accessLevel,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meeting.id))
        .returning();

      broadcastToRoom(meeting.id, {
        event: "meeting:passcodeUpdated",
        data: { accessLevel: updated.accessLevel, hasPasscode: Boolean(updated.passcode) },
      });
      broadcastToRoom(meeting.slug, {
        event: "meeting:passcodeUpdated",
        data: { accessLevel: updated.accessLevel, hasPasscode: Boolean(updated.passcode) },
      });

      return { success: true, passcode: updated.passcode, accessLevel: updated.accessLevel };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Set meeting passcode",
        description: "Sets or removes private room passcode.",
      }),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        passcode: t.Optional(t.Nullable(t.String())),
      }),
    }
  );
