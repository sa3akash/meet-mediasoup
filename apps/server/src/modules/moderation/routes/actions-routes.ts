import { Elysia, t } from "elysia";
import { moderationService } from "../moderation-service";
import { abuseDetectionService } from "../abuse-detection-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const actionsRoutes = new Elysia()
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
      ...apiDoc({
        tag: SwaggerTags.MODERATION,
        summary: "Kick participant from meeting",
        description: "Forcibly ejects participant and closes their WebRTC media streams.",
      }),
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
      ...apiDoc({
        tag: SwaggerTags.MODERATION,
        summary: "Ban or unban user account",
        description: "Sets or removes platform-level suspension and logs to audit trail.",
      }),
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
  .get(
    "/abuse-stats",
    () => {
      return {
        success: true,
        stats: abuseDetectionService.getAbuseStats(),
      };
    },
    apiDoc({
      tag: SwaggerTags.MODERATION,
      summary: "Get abuse & spam detection telemetry",
      description: "Returns rate limiting counters, blocked messages, and active security flags.",
    })
  );
