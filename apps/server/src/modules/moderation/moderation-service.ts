import { db } from "../../infrastructure/database";
import { reports, users, meetings, sessions } from "../../infrastructure/database/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { auditService } from "../admin/audit-service";
import { sendToParticipant, broadcastToRoom, participantSockets } from "../signaling/socket-registry";
import { handleSocketClose } from "../signaling";

export interface CreateReportInput {
  reporterId: string;
  reportedUserId?: string;
  reportedMeetingId?: string;
  category: "SPAM" | "HARASSMENT" | "INAPPROPRIATE_CONTENT" | "OTHER";
  reason: string;
}

export class ModerationService {
  /**
   * Submits a report against a user or a meeting room.
   */
  public async createReport(input: CreateReportInput) {
    const reportId = crypto.randomUUID();
    const [report] = await db
      .insert(reports)
      .values({
        id: reportId,
        reporterId: input.reporterId,
        reportedUserId: input.reportedUserId || null,
        reportedMeetingId: input.reportedMeetingId || null,
        category: input.category,
        reason: input.reason,
        status: "OPEN",
      })
      .returning();

    await auditService.logAction({
      actorId: input.reporterId,
      action: "SUBMIT_REPORT",
      targetType: "REPORT",
      targetId: reportId,
      details: {
        category: input.category,
        reportedUserId: input.reportedUserId,
        reportedMeetingId: input.reportedMeetingId,
      },
    });

    return report;
  }

  /**
   * Retrieves reports queue with reporter, reported user, and meeting details.
   */
  public async getReports(status?: string, category?: string, limit: number = 50, offset: number = 0) {
    try {
      const query = db
        .select({
          id: reports.id,
          category: reports.category,
          reason: reports.reason,
          status: reports.status,
          createdAt: reports.createdAt,
          resolvedAt: reports.resolvedAt,
          reporterId: reports.reporterId,
          reporterName: users.name,
          reporterEmail: users.email,
          reportedUserId: reports.reportedUserId,
          reportedMeetingId: reports.reportedMeetingId,
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterId, users.id))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset);

      const rows = await query;
      return rows;
    } catch (err) {
      console.error("[ModerationService] Failed to get reports:", err);
      return [];
    }
  }

  /**
   * Updates report status (OPEN, INVESTIGATING, RESOLVED, DISMISSED)
   */
  public async updateReportStatus(
    reportId: string,
    status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED",
    moderatorId?: string
  ) {
    const resolvedAt = status === "RESOLVED" || status === "DISMISSED" ? new Date() : null;

    const [updated] = await db
      .update(reports)
      .set({
        status,
        resolvedAt,
      })
      .where(eq(reports.id, reportId))
      .returning();

    await auditService.logAction({
      actorId: moderatorId || null,
      action: `REPORT_${status}`,
      targetType: "REPORT",
      targetId: reportId,
      details: { status },
    });

    return updated;
  }

  /**
   * Bans a user account permanently or temporarily, revokes all sessions,
   * and terminates any active in-meeting presence.
   */
  public async banUser(userId: string, moderatorId?: string, reason?: string) {
    // 1. Mark user as banned
    const [user] = await db
      .update(users)
      .set({
        bannedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // 2. Revoke all active sessions
    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.userId, userId));

    // 3. Disconnect any active sockets for this user across participant connections
    for (const [pId, ws] of participantSockets.entries()) {
      if (ws.data?.userId === userId) {
        sendToParticipant(pId, {
          event: "participant:kicked",
          data: {
            reason: reason || "Your account has been suspended by an administrator.",
            participantId: pId,
          },
        });
        handleSocketClose(ws);
        ws.close();
      }
    }

    // 4. Record audit log
    await auditService.logAction({
      actorId: moderatorId || null,
      action: "BAN_USER",
      targetType: "USER",
      targetId: userId,
      details: { reason: reason || "Violation of terms" },
    });

    return user;
  }

  /**
   * Unbans a user account and restores access.
   */
  public async unbanUser(userId: string, moderatorId?: string) {
    const [user] = await db
      .update(users)
      .set({
        bannedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    await auditService.logAction({
      actorId: moderatorId || null,
      action: "UNBAN_USER",
      targetType: "USER",
      targetId: userId,
    });

    return user;
  }

  /**
   * Forcefully removes a participant from an active meeting.
   */
  public async kickParticipant(meetingId: string, participantId: string, moderatorId?: string, reason?: string) {
    sendToParticipant(participantId, {
      event: "participant:kicked",
      data: {
        reason: reason || "You have been removed from the meeting by a moderator.",
        participantId,
      },
    });

    const targetWs = participantSockets.get(participantId);
    if (targetWs) {
      handleSocketClose(targetWs);
      targetWs.close();
    }

    broadcastToRoom(meetingId, {
      event: "participant:left",
      data: { participantId },
    });

    await auditService.logAction({
      actorId: moderatorId || null,
      action: "KICK_PARTICIPANT",
      targetType: "MEETING",
      targetId: meetingId,
      details: { participantId, reason },
    });

    return { success: true };
  }
}

export const moderationService = new ModerationService();
