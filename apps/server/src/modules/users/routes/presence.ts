import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users, userPresence } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { setUserPresence } from "../../../infrastructure/redis";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const presenceRouter = new Elysia().patch(
  "/me/presence",
  async ({ body, headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const { status } = body;

      // Update in PostgreSQL
      await db.update(users).set({ presenceStatus: status, updatedAt: new Date() }).where(eq(users.id, decoded.userId));

      await db
        .insert(userPresence)
        .values({
          id: crypto.randomUUID(),
          userId: decoded.userId,
          status,
          lastHeartbeatAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPresence.userId,
          set: { status, lastHeartbeatAt: new Date() },
        });

      // Update in Redis with 60s TTL
      await setUserPresence(decoded.userId, status);

      return { status };
    } catch {
      set.status = 401;
      return { error: "Failed to update presence" };
    }
  },
  {
    body: t.Object({
      status: t.Union([
        t.Literal("ONLINE"),
        t.Literal("AWAY"),
        t.Literal("BUSY"),
        t.Literal("OFFLINE"),
      ]),
    }),
  }
);
