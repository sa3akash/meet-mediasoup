import { moderationReportsService, CreateReportInput } from "./services/moderation-reports-service";
import { moderationEnforcementService } from "./services/moderation-enforcement-service";

export type { CreateReportInput };

export class ModerationService {
  public createReport(input: CreateReportInput) {
    return moderationReportsService.createReport(input);
  }

  public getReports(status?: string, category?: string, limit?: number, offset?: number) {
    return moderationReportsService.getReports(status, category, limit, offset);
  }

  public updateReportStatus(
    reportId: string,
    status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED",
    moderatorId?: string
  ) {
    return moderationReportsService.updateReportStatus(reportId, status, moderatorId);
  }

  public banUser(userId: string, moderatorId?: string, reason?: string) {
    return moderationEnforcementService.banUser(userId, moderatorId, reason);
  }

  public unbanUser(userId: string, moderatorId?: string) {
    return moderationEnforcementService.unbanUser(userId, moderatorId);
  }

  public kickParticipant(meetingId: string, participantId: string, moderatorId?: string, reason?: string) {
    return moderationEnforcementService.kickParticipant(meetingId, participantId, moderatorId, reason);
  }
}

export const moderationService = new ModerationService();
