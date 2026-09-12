import { db } from "../../infrastructure/database";
import { auditLogs, users } from "../../infrastructure/database/schema";
import { desc, eq } from "drizzle-orm";

export interface CreateAuditLogParams {
  actorId?: string | null;
  action: string;
  targetType: "USER" | "MEETING" | "SETTING" | "SYSTEM" | "REPORT" | "RECORDING";
  targetId: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Logs an administrative or moderation action into the audit trail.
   */
  public async logAction(params: CreateAuditLogParams) {
    try {
      const id = crypto.randomUUID();
      await db.insert(auditLogs).values({
        id,
        actorId: params.actorId || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: params.details || {},
      });
      return id;
    } catch (err) {
      console.warn("[AuditService] Failed to record audit log:", err);
      return null;
    }
  }

  /**
   * Fetches audit logs with pagination and optional actor details.
   */
  public async getAuditLogs(limit: number = 50, offset: number = 0) {
    try {
      const logs = await db
        .select({
          id: auditLogs.id,
          actorId: auditLogs.actorId,
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          details: auditLogs.details,
          createdAt: auditLogs.createdAt,
          actorName: users.name,
          actorEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorId, users.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return logs;
    } catch (err) {
      console.error("[AuditService] Failed to fetch audit logs:", err);
      return [];
    }
  }
}

export const auditService = new AuditService();
