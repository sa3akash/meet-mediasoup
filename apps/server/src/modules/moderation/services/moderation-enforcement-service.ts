import { db } from "../../../infrastructure/database";
import { users, sessions } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { auditService } from "../../admin/audit-service";
import { sendToParticipant, broadcastToRoom, participantSockets } from "../../signaling/socket-registry";
import { handleSocketClose } from "../../signaling";


export class ModerationEnforcementService {
  /**
   * Bans a user account permanently or temporarily, revokes all sessions,
   * and terminates any active in-meeting presence.
   */
  public async banUser(userId: string, moderatorId?: string, reason?: string) {
    const [user] = await db
      .update(users)
      .set({
        bannedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    await db
      .update(sessions)
      .set({ isRevoked: true })
      .where(eq(sessions.userId, userId));

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

export const moderationEnforcementService = new ModerationEnforcementService();
