import { db } from "../../../infrastructure/database";
import {
  users,
  meetings,
  meetingRecordings,
  fileUploads,
  reports,
  auditLogs,
} from "../../../infrastructure/database/schema";
import { count, eq, sql, isNull, isNotNull, or } from "drizzle-orm";

export class AdminOverviewService {
  /**
   * Aggregates global platform KPIs and health metrics for the admin overview dashboard.
   */
  public async getOverviewStats() {
    const [totalUsersRes] = await db.select({ count: count() }).from(users).where(isNull(users.deletedAt));
    const [bannedUsersRes] = await db.select({ count: count() }).from(users).where(isNotNull(users.bannedAt));
    const [activeMeetingsRes] = await db.select({ count: count() }).from(meetings).where(eq(meetings.status, "ACTIVE"));
    const [totalMeetingsRes] = await db.select({ count: count() }).from(meetings);
    const [recordingsRes] = await db.select({
      count: count(),
      totalBytes: sql<number>`coalesce(sum(${meetingRecordings.fileSizeBytes}), 0)`,
      totalDuration: sql<number>`coalesce(sum(${meetingRecordings.durationSeconds}), 0)`,
    }).from(meetingRecordings);

    const [filesRes] = await db.select({
      count: count(),
      totalBytes: sql<number>`coalesce(sum(${fileUploads.fileSizeBytes}), 0)`,
    }).from(fileUploads);

    const [pendingReportsRes] = await db.select({ count: count() }).from(reports).where(
      or(eq(reports.status, "OPEN"), eq(reports.status, "INVESTIGATING"))
    );

    const [totalAuditLogsRes] = await db.select({ count: count() }).from(auditLogs);

    const totalStorageBytes = Number(recordingsRes?.totalBytes || 0) + Number(filesRes?.totalBytes || 0);

    return {
      users: {
        total: totalUsersRes?.count || 0,
        banned: bannedUsersRes?.count || 0,
        activeNow: totalUsersRes?.count || 0,
      },
      meetings: {
        total: totalMeetingsRes?.count || 0,
        activeNow: activeMeetingsRes?.count || 0,
      },
      recordings: {
        total: recordingsRes?.count || 0,
        totalBytes: Number(recordingsRes?.totalBytes || 0),
        totalDurationSeconds: Number(recordingsRes?.totalDuration || 0),
      },
      storage: {
        totalBytes: totalStorageBytes,
        recordingsBytes: Number(recordingsRes?.totalBytes || 0),
        filesBytes: Number(filesRes?.totalBytes || 0),
        totalFiles: (recordingsRes?.count || 0) + (filesRes?.count || 0),
      },
      moderation: {
        pendingReports: pendingReportsRes?.count || 0,
      },
      auditLogs: {
        total: totalAuditLogsRes?.count || 0,
      },
    };
  }

  /**
   * Computes platform-wide storage breakdown.
   */
  public async getStorageOverview() {
    const recordings = await db
      .select({
        id: meetingRecordings.id,
        fileSize: meetingRecordings.fileSizeBytes,
        format: meetingRecordings.format,
        createdAt: meetingRecordings.createdAt,
      })
      .from(meetingRecordings);

    const uploads = await db
      .select({
        id: fileUploads.id,
        fileSize: fileUploads.fileSizeBytes,
        mimeType: fileUploads.mimeType,
        createdAt: fileUploads.createdAt,
      })
      .from(fileUploads);

    const recordingsBytes = recordings.reduce((acc, r) => acc + (r.fileSize || 0), 0);
    const uploadsBytes = uploads.reduce((acc, u) => acc + (u.fileSize || 0), 0);

    let imageBytes = 0;
    let documentBytes = 0;
    let otherBytes = 0;

    for (const u of uploads) {
      const sz = u.fileSize || 0;
      if (u.mimeType.startsWith("image/")) imageBytes += sz;
      else if (
        u.mimeType.includes("pdf") ||
        u.mimeType.includes("word") ||
        u.mimeType.includes("text") ||
        u.mimeType.includes("presentation")
      ) {
        documentBytes += sz;
      } else {
        otherBytes += sz;
      }
    }

    return {
      totalBytes: recordingsBytes + uploadsBytes,
      recordings: { totalBytes: recordingsBytes, count: recordings.length },
      uploads: {
        totalBytes: uploadsBytes,
        count: uploads.length,
        breakdown: { images: imageBytes, documents: documentBytes, other: otherBytes },
      },
      buckets: [
        { name: "meet-recordings", filesCount: recordings.length, bytes: recordingsBytes },
        { name: "meet-uploads", filesCount: uploads.length, bytes: uploadsBytes },
      ],
    };
  }
}

export const adminOverviewService = new AdminOverviewService();
