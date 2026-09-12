import { db } from "../../../infrastructure/database";
import { reports, users } from "../../../infrastructure/database/schema";
import { desc, eq } from "drizzle-orm";
import { auditService } from "../../admin/audit-service";

export interface CreateReportInput {
  reporterId: string;
  reportedUserId?: string;
  reportedMeetingId?: string;
  category: "SPAM" | "HARASSMENT" | "INAPPROPRIATE_CONTENT" | "OTHER";
  reason: string;
}

export class ModerationReportsService {
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

  public async getReports(status?: string, category?: string, limit: number = 50, offset: number = 0) {
    try {
      const rows = await db
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

      return rows;
    } catch (err) {
      console.error("[ModerationReportsService] Failed to get reports:", err);
      return [];
    }
  }

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
}

export const moderationReportsService = new ModerationReportsService();
