import { Elysia, t } from "elysia";
import { moderationService } from "./moderation-service";
import { abuseDetectionService } from "./abuse-detection-service";

export const moderationRoutes = new Elysia({ prefix: "/api/moderation" })
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
  )

  /**
   * Kick a participant from an active meeting
   */
  .post(
    "/kick",
    async ({ body, set }) => {
      try {
        const result = await moderationService.kickParticipant(
          body.meetingId,
          body.participantId,
          body.moderatorId,
          body.reason
        );
        return result;
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        meetingId: t.String(),
        participantId: t.String(),
        moderatorId: t.Optional(t.String()),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Ban or unban a user account
   */
  .post(
    "/ban",
    async ({ body, set }) => {
      try {
        if (body.action === "UNBAN") {
          const user = await moderationService.unbanUser(body.userId, body.moderatorId);
          return { success: true, user, banned: false };
        } else {
          const user = await moderationService.banUser(body.userId, body.moderatorId, body.reason);
          return { success: true, user, banned: true };
        }
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        action: t.Union([t.Literal("BAN"), t.Literal("UNBAN")]),
        moderatorId: t.Optional(t.String()),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Abuse & Spam Detection Telemetry
   */
  .get("/abuse-stats", () => {
    return {
      success: true,
      stats: abuseDetectionService.getAbuseStats(),
    };
  });
