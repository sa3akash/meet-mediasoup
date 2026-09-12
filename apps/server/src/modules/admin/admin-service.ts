import { db } from "../../infrastructure/database";
import {
  users,
  meetings,
  meetingRecordings,
  fileUploads,
  reports,
  auditLogs,
  sessions,
} from "../../infrastructure/database/schema";
import { count, desc, eq, and, sql, isNull, isNotNull, ilike, or } from "drizzle-orm";
import { auditService } from "./audit-service";
import { broadcastToRoom, roomSockets } from "../signaling/socket-registry";
import { handleSocketClose } from "../signaling";

export class AdminService {
  /**
   * Aggregates global platform KPIs and health metrics for the admin overview dashboard.
   */
  public async getOverviewStats() {
    try {
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
    } catch (err) {
      console.error("[AdminService] Failed to calculate overview stats:", err);
      throw err;
    }
  }

  /**
   * Lists users with search query, role filtering, ban status, and pagination.
   */
  public async getUsers(query?: { search?: string; role?: string; isBanned?: boolean; limit?: number; offset?: number }) {
    const limit = query?.limit || 50;
    const offset = query?.offset || 0;

    const conditions = [isNull(users.deletedAt)];

    if (query?.search) {
      const s = `%${query.search.toLowerCase()}%`;
      conditions.push(or(ilike(users.name, s), ilike(users.email, s))!);
    }
    if (query?.role) {
      conditions.push(eq(users.role, query.role));
    }
    if (query?.isBanned !== undefined) {
      conditions.push(query.isBanned ? isNotNull(users.bannedAt) : isNull(users.bannedAt));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db.select({ count: count() }).from(users).where(whereClause);
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl,
        presenceStatus: users.presenceStatus,
        isVerified: users.isVerified,
        bannedAt: users.bannedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      users: userList,
      total: countResult?.count || 0,
      limit,
      offset,
    };
  }

  /**
   * Promotes or changes a user's role.
   */
  public async updateUserRole(userId: string, role: "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN", actorId?: string) {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    await auditService.logAction({
      actorId,
      action: "UPDATE_USER_ROLE",
      targetType: "USER",
      targetId: userId,
      details: { newRole: role },
    });

    return user;
  }

  /**
   * Soft deletes a user account.
   */
  public async deleteUser(userId: string, actorId?: string) {
    const [user] = await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId));

    await auditService.logAction({
      actorId,
      action: "DELETE_USER",
      targetType: "USER",
      targetId: userId,
    });

    return user;
  }

  /**
   * Lists meetings with status, host, duration, and participant counts.
   */
  public async getMeetings(status?: string, limit: number = 50, offset: number = 0) {
    const conditions = [];
    if (status) {
      conditions.push(eq(meetings.status, status));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalCount] = await db.select({ count: count() }).from(meetings).where(whereClause);
    const meetingList = await db
      .select({
        id: meetings.id,
        title: meetings.title,
        slug: meetings.slug,
        type: meetings.type,
        accessLevel: meetings.accessLevel,
        status: meetings.status,
        actualStartAt: meetings.actualStartAt,
        actualEndAt: meetings.actualEndAt,
        createdAt: meetings.createdAt,
        hostId: meetings.hostId,
        hostName: users.name,
        hostEmail: users.email,
      })
      .from(meetings)
      .leftJoin(users, eq(meetings.hostId, users.id))
      .where(whereClause)
      .orderBy(desc(meetings.createdAt))
      .limit(limit)
      .offset(offset);

    // Enrich with active socket participants count
    const enriched = meetingList.map((m) => {
      const activeSockets = roomSockets.get(m.id);
      return {
        ...m,
        activeParticipantsCount: activeSockets ? activeSockets.size : 0,
      };
    });

    return {
      meetings: enriched,
      total: totalCount?.count || 0,
      limit,
      offset,
    };
  }

  /**
   * Terminates an active meeting immediately.
   */
  public async terminateMeeting(meetingId: string, actorId?: string, reason?: string) {
    const [meeting] = await db
      .update(meetings)
      .set({
        status: "ENDED",
        actualEndAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    // Broadcast room end and disconnect all participants
    broadcastToRoom(meetingId, {
      event: "meeting:ended",
      data: { reason: reason || "This meeting was terminated by an administrator." },
    });

    const sockets = roomSockets.get(meetingId);
    if (sockets) {
      for (const ws of sockets) {
        handleSocketClose(ws);
        ws.close();
      }
    }

    await auditService.logAction({
      actorId,
      action: "TERMINATE_MEETING",
      targetType: "MEETING",
      targetId: meetingId,
      details: { reason },
    });

    return meeting;
  }

  /**
   * Retrieves all recordings with metadata.
   */
  public async getRecordings(limit: number = 50, offset: number = 0) {
    const [totalCount] = await db.select({ count: count() }).from(meetingRecordings);
    const recordingList = await db
      .select({
        id: meetingRecordings.id,
        meetingId: meetingRecordings.meetingId,
        type: meetingRecordings.type,
        format: meetingRecordings.format,
        fileUrl: meetingRecordings.fileUrl,
        fileSize: meetingRecordings.fileSizeBytes,
        duration: meetingRecordings.durationSeconds,
        status: meetingRecordings.status,
        createdAt: meetingRecordings.createdAt,
        meetingTitle: meetings.title,
        meetingSlug: meetings.slug,
      })
      .from(meetingRecordings)
      .leftJoin(meetings, eq(meetingRecordings.meetingId, meetings.id))
      .orderBy(desc(meetingRecordings.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      recordings: recordingList,
      total: totalCount?.count || 0,
      limit,
      offset,
    };
  }

  /**
   * Deletes a recording entry.
   */
  public async deleteRecording(recordingId: string, actorId?: string) {
    const [deleted] = await db
      .delete(meetingRecordings)
      .where(eq(meetingRecordings.id, recordingId))
      .returning();

    await auditService.logAction({
      actorId,
      action: "DELETE_RECORDING",
      targetType: "RECORDING",
      targetId: recordingId,
      details: { fileUrl: deleted?.fileUrl },
    });

    return deleted;
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

    // Categorize uploads by mimeType
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
      recordings: {
        totalBytes: recordingsBytes,
        count: recordings.length,
      },
      uploads: {
        totalBytes: uploadsBytes,
        count: uploads.length,
        breakdown: {
          images: imageBytes,
          documents: documentBytes,
          other: otherBytes,
        },
      },
      buckets: [
        { name: "meet-recordings", filesCount: recordings.length, bytes: recordingsBytes },
        { name: "meet-uploads", filesCount: uploads.length, bytes: uploadsBytes },
      ],
    };
  }
}

export const adminService = new AdminService();
