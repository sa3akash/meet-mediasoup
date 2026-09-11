import { Elysia, t } from "elysia";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../../../infrastructure/database";
import { passkeys, sessions } from "../../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq, and, desc } from "drizzle-orm";
import { parseDeviceInfo } from "../utils/device-parser";
import {
  getPasskeyRegistrationOptions,
  verifyAndSavePasskey,
  getPasskeyAuthOptions,
  verifyPasskeyAuth,
} from "../passkeys";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "enterprise-super-secret-refresh-key";

export const passkeysRouter = new Elysia()
  .get("/passkeys/register-options", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return await getPasskeyRegistrationOptions(decoded.userId);
  })
  .post(
    "/passkeys/register-verify",
    async ({ body, headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return await verifyAndSavePasskey(decoded.userId, body.response, body.name);
    },
    {
      body: t.Object({
        name: t.String(),
        response: t.Any(),
      }),
    }
  )
  .get("/passkeys/auth-options", async ({ query }) => {
    return await getPasskeyAuthOptions(query.email);
  })
  .post(
    "/passkeys/auth-verify",
    async ({ body, headers }) => {
      const { user } = await verifyPasskeyAuth(body);
      const sessionId = generateUUIDv7();
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role, email: user.email, sessionId },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const refreshToken = jwt.sign(
        { userId: user.id, sessionId },
        REFRESH_SECRET,
        { expiresIn: "7d" }
      );
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const userAgent = headers["user-agent"] || null;
      const { deviceName, deviceType } = parseDeviceInfo(userAgent);

      await db.insert(sessions).values({
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        userAgent,
        deviceName,
        deviceType,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      };
    },
    {
      body: t.Any(),
    }
  )
  .get("/passkeys", async ({ headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const keys = await db.query.passkeys.findMany({
      where: eq(passkeys.userId, decoded.userId),
      orderBy: [desc(passkeys.createdAt)],
    });
    return {
      passkeys: keys.map((pk) => ({
        id: pk.id,
        name: pk.name,
        deviceType: pk.deviceType,
        createdAt: pk.createdAt,
        lastUsedAt: pk.lastUsedAt,
      })),
    };
  })
  .delete("/passkeys/:id", async ({ params, headers, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    await db
      .delete(passkeys)
      .where(and(eq(passkeys.id, params.id), eq(passkeys.userId, decoded.userId)));

    return { message: "Passkey removed" };
  });
