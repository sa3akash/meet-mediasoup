import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetingSettings } from "../../../infrastructure/database/schema";
import { broadcastToRoom } from "../../signaling/socket-registry";
import { eq } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";
import { findMeeting } from "../services/meeting-query-helper";

export const settingsRoutes = new Elysia()
  /**
   * Update meeting settings
   */
  .patch(
    "/:id/settings",
    async ({ params, body, set }) => {
      const meeting = await findMeeting(params.id);
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

      broadcastToRoom(meeting.id, { event: "meeting:settingsUpdated", data: { settings: updated } });
      broadcastToRoom(meeting.slug, { event: "meeting:settingsUpdated", data: { settings: updated } });

      return { settings: updated };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Update meeting settings",
        description: "Updates security, recording, chat, and media constraints for a meeting.",
      }),
      params: t.Object({ id: t.String() }),
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
  );
