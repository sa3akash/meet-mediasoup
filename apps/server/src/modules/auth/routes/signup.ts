import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users } from "../../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "../../../infrastructure/mailer";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const signupRouter = new Elysia()
  .post(
    "/signup",
    async ({ body, set }) => {
      const { email, password, name } = body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });
      if (existing) {
        set.status = 409;
        return { error: "User already exists with this email" };
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = generateUUIDv7();

      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          email: normalizedEmail,
          name,
          passwordHash,
          isVerified: false,
        })
        .returning();

      const verifyToken = jwt.sign({ userId: newUser.id, purpose: "email-verify" }, JWT_SECRET, {
        expiresIn: "24h",
      });

      sendVerificationEmail(newUser.email, newUser.name, verifyToken).catch((err) => {
        console.warn("[Mailer] Failed to send verification email:", err);
      });

      return {
        message: "Account created successfully. Please check your email to verify your account.",
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        name: t.String(),
      }),
    }
  )
  .post(
    "/verify-email",
    async ({ body, set }) => {
      const { token } = body;
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; purpose?: string };
        if (decoded.purpose !== "email-verify") {
          set.status = 400;
          return { error: "Invalid verification token" };
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, decoded.userId),
        });

        if (!user) {
          set.status = 404;
          return { error: "User not found" };
        }

        if (user.isVerified) {
          return { message: "Email is already verified" };
        }

        await db.update(users).set({ isVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id));
        return { message: "Email successfully verified! You can now log in." };
      } catch {
        set.status = 400;
        return { error: "Invalid or expired verification token" };
      }
    },
    {
      body: t.Object({
        token: t.String(),
      }),
    }
  );
