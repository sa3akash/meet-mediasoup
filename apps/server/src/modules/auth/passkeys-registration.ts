import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { db } from "../../infrastructure/database";
import { passkeys, users } from "../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq } from "drizzle-orm";
import { redis } from "../../infrastructure/redis";

const rpName = process.env.RP_NAME || "Meet Enterprise";
const rpID = process.env.RP_ID || "localhost";
const expectedOrigin = process.env.ORIGIN || "http://localhost:3000";

export async function getPasskeyRegistrationOptions(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new Error("User not found");

  const existingPasskeys = await db.query.passkeys.findMany({
    where: eq(passkeys.userId, userId),
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new Uint8Array(Buffer.from(user.id)),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports ? (JSON.parse(pk.transports) as any) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await redis.setex(`passkey:challenge:${userId}`, 300, options.challenge);
  return options;
}

export async function verifyAndSavePasskey(userId: string, body: any, name: string) {
  const expectedChallenge = await redis.get(`passkey:challenge:${userId}`);
  if (!expectedChallenge) throw new Error("Challenge expired or not found");

  const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey verification failed");
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await db.insert(passkeys).values({
    id: generateUUIDv7(),
    userId,
    credentialId: Buffer.from(credential.id).toString("base64url"),
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports ? JSON.stringify(credential.transports) : null,
    name: name || "Security Key",
  });

  await redis.del(`passkey:challenge:${userId}`);
  return { verified: true };
}
