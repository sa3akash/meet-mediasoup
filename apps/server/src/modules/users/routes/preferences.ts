import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { notificationPreferences } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const preferencesRouter = new Elysia()
  .get("/me/notifications/preferences", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      let prefs = await db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, decoded.userId),
      });

      if (!prefs) {
        const [created] = await db
          .insert(notificationPreferences)
          .values({
            id: crypto.randomUUID(),
            userId: decoded.userId,
            emailReminders: true,
            emailInvites: true,
            pushNewMessages: true,
            inAppSounds: true,
          })
          .returning();
        prefs = created;
      }

      return { preferences: prefs };
    } catch {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .put(
    "/me/notifications/preferences",
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
          .insert(notificationPreferences)
          .values({
            id: crypto.randomUUID(),
            userId: decoded.userId,
            ...body,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: notificationPreferences.userId,
            set: {
              ...body,
              updatedAt: new Date(),
            },
          })
          .returning();

        return { preferences: updated };
      } catch {
        set.status = 401;
        return { error: "Failed to update notification preferences" };
      }
    },
    {
      body: t.Object({
        emailReminders: t.Boolean(),
        emailInvites: t.Boolean(),
        pushNewMessages: t.Boolean(),
        inAppSounds: t.Boolean(),
      }),
    }
  );
