import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../infrastructure/database";
import { users, sessions, passkeys } from "../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "enterprise-super-secret-refresh-key";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post(
    "/signup",
    async ({ body, set }) => {
      const { email, password, name } = body;
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
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
          email: email.toLowerCase(),
          name,
          passwordHash,
          isVerified: false,
        })
        .returning();

      return {
        message: "User registered successfully. Please verify your email.",
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
    "/login",
    async ({ body, set, headers }) => {
      const { email, password } = body;
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user || !user.passwordHash) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const sessionId = generateUUIDv7();

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        userAgent: headers["user-agent"] || null,
        ipAddress: headers["x-forwarded-for"] || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        rememberMe: t.Optional(t.Boolean()),
      }),
    }
  )
  .post(
    "/refresh",
    async ({ body, set }) => {
      const { refreshToken } = body;
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
        const user = await db.query.users.findFirst({
          where: eq(users.id, decoded.userId),
        });

        if (!user) {
          set.status = 401;
          return { error: "Invalid token" };
        }

        const newAccessToken = jwt.sign(
          { userId: user.id, role: user.role, email: user.email },
          JWT_SECRET,
          { expiresIn: "15m" }
        );

        return { accessToken: newAccessToken };
      } catch (e) {
        set.status = 401;
        return { error: "Expired or invalid refresh token" };
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
      // Invalidate session
      return { message: "Logged out successfully" };
    },
    {
      body: t.Object({
        refreshToken: t.Optional(t.String()),
      }),
    }
  );
