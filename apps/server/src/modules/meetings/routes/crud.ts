import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings } from "../../../infrastructure/database/schema";
import { eq, desc } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";
import { createMeetingWithSettings } from "../services/meeting-creation-helper";

export const crudRoutes = new Elysia()
  /**
   * Create a new instant or scheduled meeting
   */
  .post(
    "/",
    async ({ body }) => {
      return createMeetingWithSettings(body as any);
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Create meeting",
        description: "Creates an instant or scheduled meeting session with customizable security and room settings.",
      }),
      body: t.Object({
        hostId: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        accessLevel: t.Optional(t.String()),
        passcode: t.Optional(t.String()),
        inviteEmails: t.Optional(t.Array(t.String())),
        scheduledStartAt: t.Optional(t.String()),
        scheduledEndAt: t.Optional(t.String()),
        recurrenceRule: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
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

  /**
   * Get meeting by ID
   */
  .get(
    "/:id",
    async ({ params, set }) => {
      const meeting = await db.query.meetings.findFirst({
        where: eq(meetings.id, params.id),
        with: { settings: true, host: true },
      });
      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }
      return { meeting };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Get meeting by ID",
        description: "Retrieves complete meeting metadata and host configuration.",
      }),
      params: t.Object({ id: t.String() }),
    }
  )

  /**
   * Get meetings hosted by a specific user
   */
  .get(
    "/user/:userId",
    async ({ params }) => {
      const list = await db.query.meetings.findMany({
        where: eq(meetings.hostId, params.userId),
        with: { settings: true },
        orderBy: [desc(meetings.createdAt)],
        limit: 30,
      });
      return { meetings: list };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "List user meetings",
        description: "Fetches recent meetings organized by the given user.",
      }),
      params: t.Object({ userId: t.String() }),
    }
  )

  /**
   * Cancel or delete a meeting
   */
  .delete(
    "/:id",
    async ({ params }) => {
      await db
        .update(meetings)
        .set({ status: "CANCELLED", deletedAt: new Date() })
        .where(eq(meetings.id, params.id));
      return { success: true };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Cancel meeting",
        description: "Cancels and soft-deletes a meeting session.",
      }),
      params: t.Object({ id: t.String() }),
    }
  );
