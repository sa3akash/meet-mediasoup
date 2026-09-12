import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { sessions } from "../../../infrastructure/database/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const sessionsRouter = new Elysia()
  /**
   * List active sessions for authenticated user
   */
  .get(
    "/sessions",
    async ({ headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId?: string };

        const activeSessions = await db.query.sessions.findMany({
          where: and(eq(sessions.userId, decoded.userId), eq(sessions.isRevoked, false)),
          orderBy: [desc(sessions.createdAt)],
        });

        return {
          sessions: activeSessions.map((s) => ({
            id: s.id,
            deviceName: s.deviceName,
            deviceType: s.deviceType,
            ipAddress: s.ipAddress,
            createdAt: s.createdAt,
            isCurrent: s.id === decoded.sessionId,
          })),
        };
      } catch {
        set.status = 401;
        return { error: "Invalid session token" };
      }
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "List active sessions",
      description: "Returns all active login sessions and device information for current user.",
    })
  )

  /**
   * Revoke specific session
   */
  .delete(
    "/sessions/:id",
    async ({ params, headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        await db
          .update(sessions)
          .set({ isRevoked: true, updatedAt: new Date() })
          .where(and(eq(sessions.id, params.id), eq(sessions.userId, decoded.userId)));

        return { message: "Session revoked" };
      } catch {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "Revoke session",
      description: "Invalidates a specific session by ID.",
    })
  )

  /**
   * Revoke all other active sessions except current
   */
  .post(
    "/sessions/revoke-others",
    async ({ headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId?: string };

        if (decoded.sessionId) {
          await db
            .update(sessions)
            .set({ isRevoked: true, updatedAt: new Date() })
            .where(and(eq(sessions.userId, decoded.userId), ne(sessions.id, decoded.sessionId)));
        }

        return { message: "All other sessions have been revoked" };
      } catch {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "Revoke other sessions",
      description: "Logs out all other devices and sessions except the current one.",
    })
  );
