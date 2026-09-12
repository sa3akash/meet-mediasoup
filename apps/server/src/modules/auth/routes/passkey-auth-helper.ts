import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../../../infrastructure/database";
import { sessions } from "../../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { parseDeviceInfo } from "../utils/device-parser";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "enterprise-super-secret-refresh-key";

export function getAuthUserId(headers: Record<string, string | undefined>): string | null {
  const authHeader = headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function createPasskeySession(user: any, userAgent: string | null) {
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
}
