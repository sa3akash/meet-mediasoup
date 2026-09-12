import { Elysia, t } from "elysia";
import { adminService } from "./admin-service";
import { auditService } from "./audit-service";
import { moderationService } from "../moderation/moderation-service";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  /**
   * System Overview & Platform KPIs
   */
  .get("/overview", async () => {
    const stats = await adminService.getOverviewStats();
    return { success: true, stats };
  })

  /**
   * Users Management
   */
  .get(
    "/users",
    async ({ query }) => {
      const { search, role, isBanned, limit, offset } = query;
      const res = await adminService.getUsers({
        search,
        role,
        isBanned: isBanned === "true" ? true : isBanned === "false" ? false : undefined,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });
      return { success: true, ...res };
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        role: t.Optional(t.String()),
        isBanned: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update User Role
   */
  .patch(
    "/users/:id/role",
    async ({ params, body, set }) => {
      try {
        const user = await adminService.updateUserRole(params.id, body.role as any, body.actorId);
        return { success: true, user };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        role: t.Union([
          t.Literal("USER"),
          t.Literal("MODERATOR"),
          t.Literal("ADMIN"),
          t.Literal("SUPER_ADMIN"),
        ]),
        actorId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Ban User
   */
  .post(
    "/users/:id/ban",
    async ({ params, body, set }) => {
      try {
        const user = await moderationService.banUser(params.id, body.actorId, body.reason);
        return { success: true, user, banned: true };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        actorId: t.Optional(t.String()),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Unban User
   */
  .post(
    "/users/:id/unban",
    async ({ params, body, set }) => {
      try {
        const user = await moderationService.unbanUser(params.id, body.actorId);
        return { success: true, user, banned: false };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        actorId: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete User
   */
  .delete(
    "/users/:id",
    async ({ params, body, set }) => {
      try {
        const actorId = (body as any)?.actorId;
        const user = await adminService.deleteUser(params.id, actorId);
        return { success: true, user };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    }
  )

  /**
   * Meetings Management
   */
  .get(
    "/meetings",
    async ({ query }) => {
      const { status, limit = "50", offset = "0" } = query;
      const res = await adminService.getMeetings(status, parseInt(limit, 10), parseInt(offset, 10));
      return { success: true, ...res };
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Force Terminate Meeting
   */
  .post(
    "/meetings/:id/terminate",
    async ({ params, body, set }) => {
      try {
        const meeting = await adminService.terminateMeeting(params.id, body.actorId, body.reason);
        return { success: true, meeting };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        actorId: t.Optional(t.String()),
        reason: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Recordings Registry
   */
  .get(
    "/recordings",
    async ({ query }) => {
      const { limit = "50", offset = "0" } = query;
      const res = await adminService.getRecordings(parseInt(limit, 10), parseInt(offset, 10));
      return { success: true, ...res };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete Recording
   */
  .delete(
    "/recordings/:id",
    async ({ params, body, set }) => {
      try {
        const actorId = (body as any)?.actorId;
        const recording = await adminService.deleteRecording(params.id, actorId);
        return { success: true, recording };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    }
  )

  /**
   * Storage Breakdown
   */
  .get("/storage", async () => {
    const storage = await adminService.getStorageOverview();
    return { success: true, storage };
  })

  /**
   * Audit Logs
   */
  .get(
    "/audit-logs",
    async ({ query }) => {
      const { limit = "50", offset = "0" } = query;
      const logs = await auditService.getAuditLogs(parseInt(limit, 10), parseInt(offset, 10));
      return { success: true, logs, count: logs.length };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  );
