import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const profileRouter = new Elysia()
  .get("/me", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
        with: {
          presence: true,
          notificationPreferences: true,
        },
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          coverUrl: user.coverUrl,
          bio: user.bio,
          timezone: user.timezone,
          language: user.language,
          theme: user.theme,
          presenceStatus: user.presenceStatus,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          notificationPreferences: user.notificationPreferences,
        },
      };
    } catch {
      set.status = 401;
      return { error: "Invalid token" };
    }
  })
  .patch(
    "/me",
    async ({ body, headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        const [updated] = await db
          .update(users)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(eq(users.id, decoded.userId))
          .returning();

        return { user: updated };
      } catch {
        set.status = 401;
        return { error: "Failed to update profile" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        language: t.Optional(t.String()),
        theme: t.Optional(t.String()),
      }),
    }
  );
