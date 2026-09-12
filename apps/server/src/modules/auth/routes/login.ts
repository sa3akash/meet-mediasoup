import { Elysia, t } from "elysia";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../../infrastructure/database";
import { users, sessions } from "../../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq } from "drizzle-orm";
import { parseDeviceInfo } from "../utils/device-parser";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "enterprise-super-secret-refresh-key";

export const loginRouter = new Elysia().post(
  "/login",
  async ({ body, set, headers }) => {
    const { email, password, rememberMe = false } = body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user || !user.passwordHash) {
      set.status = 401;
      return { error: "Invalid email or password" };
    }

    if (user.bannedAt) {
      set.status = 403;
      return { error: "This account has been suspended" };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      set.status = 401;
      return { error: "Invalid email or password" };
    }

    const sessionId = generateUUIDv7();
    const sessionDurationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, sessionId },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId },
      REFRESH_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const userAgent = headers["user-agent"] || null;
    const ipAddress = headers["x-forwarded-for"] || null;
    const { deviceName, deviceType } = parseDeviceInfo(userAgent);

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      userAgent,
      ipAddress: typeof ipAddress === "string" ? ipAddress : null,
      deviceName,
      deviceType,
      expiresAt: new Date(Date.now() + sessionDurationMs),
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
    };
  },
  {
    ...apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "User login",
      description: "Authenticates user with email/password and returns session and JWT tokens.",
    }),
    body: t.Object({
      email: t.String(),
      password: t.String(),
      rememberMe: t.Optional(t.Boolean()),
    }),
  }
);
