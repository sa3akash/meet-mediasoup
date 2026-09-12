import { db } from "../../../infrastructure/database";
import { meetings, users, meetingRecordings } from "../../../infrastructure/database/schema";
import { count, desc, eq, and } from "drizzle-orm";
import { auditService } from "../audit-service";
import { broadcastToRoom, roomSockets } from "../../signaling/socket-registry";
import { handleSocketClose } from "../../signaling";

export class AdminMeetingsService {
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
}

export const adminMeetingsService = new AdminMeetingsService();
