import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users, sessions } from "../../../infrastructure/database/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "enterprise-super-secret-refresh-key";

export const tokenRouter = new Elysia()
  .post(
    "/refresh",
    async ({ body, set }) => {
      const { refreshToken } = body;
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string; sessionId?: string };

        const session = decoded.sessionId
          ? await db.query.sessions.findFirst({
              where: and(eq(sessions.id, decoded.sessionId), eq(sessions.isRevoked, false)),
            })
          : null;

        if (!session || session.expiresAt < new Date()) {
          set.status = 401;
          return { error: "Session expired or revoked" };
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, decoded.userId),
        });

        if (!user || user.bannedAt) {
          set.status = 401;
          return { error: "User unauthorized" };
        }

        const newRefreshToken = jwt.sign(
          { userId: user.id, sessionId: session.id },
          REFRESH_SECRET,
          { expiresIn: "7d" }
        );
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

        await db
          .update(sessions)
          .set({ refreshTokenHash: newRefreshTokenHash, updatedAt: new Date() })
          .where(eq(sessions.id, session.id));

        const newAccessToken = jwt.sign(
          { userId: user.id, role: user.role, email: user.email, sessionId: session.id },
          JWT_SECRET,
          { expiresIn: "15m" }
        );

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      } catch {
        set.status = 401;
        return { error: "Invalid refresh token" };
      }
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )
  .post(
    "/logout",
    async ({ body }) => {
      const { refreshToken } = body;
      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { sessionId?: string };
          if (decoded.sessionId) {
            await db
              .update(sessions)
              .set({ isRevoked: true, updatedAt: new Date() })
              .where(eq(sessions.id, decoded.sessionId));
          }
        } catch {}
      }
      return { message: "Logged out successfully" };
    },
    {
      body: t.Object({
        refreshToken: t.Optional(t.String()),
      }),
    }
  );
