import { Elysia, t } from "elysia";
import { adminMeetingsService } from "../services/admin-meetings-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const adminMeetingsRoutes = new Elysia()
  /**
   * Meetings Management
   */
  .get(
    "/meetings",
    async ({ query }) => {
      const { status, limit = "50", offset = "0" } = query;
      const res = await adminMeetingsService.getMeetings(status, parseInt(limit, 10), parseInt(offset, 10));
      return { success: true, ...res };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "List all meetings",
        description: "Returns active and historical meetings with live participant counts.",
      }),
      query: t.Object({
        status: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Force Terminate Meeting
   */
  .post(
    "/meetings/:id/terminate",
    async ({ params, body, set }) => {
      try {
        const meeting = await adminMeetingsService.terminateMeeting(params.id, body.actorId, body.reason);
        return { success: true, meeting };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Force terminate meeting",
        description: "Forcefully terminates meeting for all participants and broadcasts meeting:ended.",
      }),
      params: t.Object({ id: t.String() }),
      body: t.Object({
        actorId: t.Optional(t.String()),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Recordings Registry
   */
  .get(
    "/recordings",
    async ({ query }) => {
      const { limit = "50", offset = "0" } = query;
      const res = await adminMeetingsService.getRecordings(parseInt(limit, 10), parseInt(offset, 10));
      return { success: true, ...res };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "List cloud recordings",
        description: "Retrieves complete catalog of recorded meetings with file sizes and playback URLs.",
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete Recording
   */
  .delete(
    "/recordings/:id",
    async ({ params, body, set }) => {
      try {
        const actorId = (body as any)?.actorId;
        const recording = await adminMeetingsService.deleteRecording(params.id, actorId);
        return { success: true, recording };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.ADMIN,
        summary: "Delete recording",
        description: "Deletes a cloud recording asset from the database and storage.",
      }),
      params: t.Object({ id: t.String() }),
    }
  );
