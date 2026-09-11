import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { db } from "../../infrastructure/database";
import { passkeys, users } from "../../infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { redis } from "../../infrastructure/redis";

const rpID = process.env.RP_ID || "localhost";
const expectedOrigin = process.env.ORIGIN || "http://localhost:3000";

export async function getPasskeyAuthOptions(email?: string) {
  let allowCredentials: any[] | undefined = undefined;

  if (email) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    if (user) {
      const userPasskeys = await db.query.passkeys.findMany({
        where: eq(passkeys.userId, user.id),
      });
      allowCredentials = userPasskeys.map((pk) => ({
        id: pk.credentialId,
        transports: pk.transports ? JSON.parse(pk.transports) : undefined,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
  });

  const challengeKey = `passkey:auth_challenge:${options.challenge}`;
  await redis.setex(challengeKey, 300, JSON.stringify({ email: email || null }));

  return options;
}

export async function verifyPasskeyAuth(body: any) {
  const credentialId = body.id;
  const passkey = await db.query.passkeys.findFirst({
    where: eq(passkeys.credentialId, credentialId),
    with: { user: true },
  });

  if (!passkey || !passkey.user) {
    throw new Error("Passkey not registered");
  }

  const clientDataJSON = JSON.parse(Buffer.from(body.response.clientDataJSON, "base64url").toString());
  const challenge = clientDataJSON.challenge;

  const challengeData = await redis.get(`passkey:auth_challenge:${challenge}`);
  if (!challengeData) {
    throw new Error("Challenge expired");
  }

  const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge,
    expectedOrigin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, "base64url"),
      counter: passkey.counter,
      transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
    },
  });

  if (!verification.verified) {
    throw new Error("Authentication failed");
  }

  await db
    .update(passkeys)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    })
    .where(eq(passkeys.id, passkey.id));

  await redis.del(`passkey:auth_challenge:${challenge}`);
  return { user: passkey.user };
}
