import { Elysia, t } from "elysia";
import { moderationService } from "../moderation-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const reportsRoutes = new Elysia()
  /**
   * Submit a report against a user or a meeting room
   */
  .post(
    "/reports",
    async ({ body, set }) => {
      try {
        const report = await moderationService.createReport(body as any);
        return { success: true, report };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MODERATION,
        summary: "Submit user or meeting report",
        description: "Creates an incident report for spam, harassment, or inappropriate conduct.",
      }),
      body: t.Object({
        reporterId: t.String(),
        reportedUserId: t.Optional(t.String()),
        reportedMeetingId: t.Optional(t.String()),
        category: t.Union([
          t.Literal("SPAM"),
          t.Literal("HARASSMENT"),
          t.Literal("INAPPROPRIATE_CONTENT"),
          t.Literal("OTHER"),
        ]),
        reason: t.String(),
      }),
    }
  )

  /**
   * List reports queue for moderation review
   */
  .get(
    "/reports",
    async ({ query }) => {
      const { status, category, limit = "50", offset = "0" } = query;
      const reports = await moderationService.getReports(
        status,
        category,
        parseInt(limit, 10),
        parseInt(offset, 10)
      );
      return { success: true, reports, count: reports.length };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MODERATION,
        summary: "List moderation reports queue",
        description: "Returns pending, investigating, or resolved reports for review by admins/moderators.",
      }),
      query: t.Object({
        status: t.Optional(t.String()),
        category: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update report status (OPEN, INVESTIGATING, RESOLVED, DISMISSED)
   */
  .patch(
    "/reports/:id",
    async ({ params, body, set }) => {
      try {
        const report = await moderationService.updateReportStatus(
          params.id,
          body.status as any,
          body.moderatorId
        );
        return { success: true, report };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MODERATION,
        summary: "Update report status",
      }),
      body: t.Object({
        status: t.Union([
          t.Literal("OPEN"),
          t.Literal("INVESTIGATING"),
          t.Literal("RESOLVED"),
          t.Literal("DISMISSED"),
        ]),
        moderatorId: t.Optional(t.String()),
      }),
    }
  );
