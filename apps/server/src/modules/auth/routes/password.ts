import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users, sessions } from "../../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "../../../infrastructure/mailer";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const passwordRouter = new Elysia()
  .post(
    "/forgot-password",
    async ({ body }) => {
      const { email } = body;
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase().trim()),
      });

      if (user) {
        const resetToken = jwt.sign({ userId: user.id, purpose: "password-reset" }, JWT_SECRET, {
          expiresIn: "1h",
        });
        sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) => {
          console.warn("[Mailer] Password reset email failure:", err);
        });
      }

      return { message: "If an account exists with this email, a password reset link has been dispatched." };
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    }
  )
  .post(
    "/reset-password",
    async ({ body, set }) => {
      const { token, newPassword } = body;
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; purpose?: string };
        if (decoded.purpose !== "password-reset") {
          set.status = 400;
          return { error: "Invalid reset token" };
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await db
          .update(users)
          .set({ passwordHash, updatedAt: new Date() })
          .where(eq(users.id, decoded.userId));

        // Invalidate all active sessions across devices
        await db
          .update(sessions)
          .set({ isRevoked: true, updatedAt: new Date() })
          .where(eq(sessions.userId, decoded.userId));

        return { message: "Password updated successfully! All active sessions have been revoked." };
      } catch {
        set.status = 400;
        return { error: "Invalid or expired password reset link" };
      }
    },
    {
      body: t.Object({
        token: t.String(),
        newPassword: t.String(),
      }),
    }
  )
  .post(
    "/change-password",
    async ({ body, headers, set }) => {
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
        });

        if (!user || !user.passwordHash) {
          set.status = 401;
          return { error: "User not found" };
        }

        const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
        if (!valid) {
          set.status = 400;
          return { error: "Current password is incorrect" };
        }

        const newHash = await bcrypt.hash(body.newPassword, 12);
        await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id));

        return { message: "Password changed successfully" };
      } catch {
        set.status = 401;
        return { error: "Invalid token" };
      }
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
    }
  );
