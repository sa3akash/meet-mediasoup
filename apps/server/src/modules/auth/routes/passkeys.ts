import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { passkeys } from "../../../infrastructure/database/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getPasskeyRegistrationOptions,
  verifyAndSavePasskey,
  getPasskeyAuthOptions,
  verifyPasskeyAuth,
} from "../passkeys";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";
import { getAuthUserId, createPasskeySession } from "./passkey-auth-helper";

export const passkeysRouter = new Elysia()
  /**
   * Get WebAuthn registration options
   */
  .get(
    "/passkeys/register-options",
    async ({ headers, set }) => {
      const userId = getAuthUserId(headers);
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      return await getPasskeyRegistrationOptions(userId);
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "Get passkey registration options",
      description: "Generates WebAuthn registration challenge for authenticated user.",
    })
  )

  /**
   * Verify and complete WebAuthn registration
   */
  .post(
    "/passkeys/register-verify",
    async ({ body, headers, set }) => {
      const userId = getAuthUserId(headers);
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      return await verifyAndSavePasskey(userId, body.response, body.name);
    },
    {
      ...apiDoc({
        tag: SwaggerTags.AUTH,
        summary: "Verify passkey registration",
        description: "Validates WebAuthn client response and registers hardware security key.",
      }),
      body: t.Object({
        name: t.String(),
        response: t.Any(),
      }),
    }
  )

  /**
   * Get WebAuthn assertion challenge for passwordless login
   */
  .get(
    "/passkeys/auth-options",
    async ({ query }) => {
      return await getPasskeyAuthOptions(query.email);
    },
    {
      ...apiDoc({
        tag: SwaggerTags.AUTH,
        summary: "Get passkey login challenge",
        description: "Generates WebAuthn authentication assertion options.",
      }),
      query: t.Object({
        email: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Verify WebAuthn assertion and log in user
   */
  .post(
    "/passkeys/auth-verify",
    async ({ body, headers }) => {
      const { user } = await verifyPasskeyAuth(body);
      const userAgent = headers["user-agent"] || null;
      return await createPasskeySession(user, userAgent);
    },
    {
      ...apiDoc({
        tag: SwaggerTags.AUTH,
        summary: "Verify passkey login",
        description: "Verifies biometric/hardware passkey and issues session tokens.",
      }),
      body: t.Any(),
    }
  )

  /**
   * List registered passkeys for user
   */
  .get(
    "/passkeys",
    async ({ headers, set }) => {
      const userId = getAuthUserId(headers);
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const keys = await db.query.passkeys.findMany({
        where: eq(passkeys.userId, userId),
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
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "List user passkeys",
      description: "Returns registered passkeys and last used timestamps.",
    })
  )

  /**
   * Remove a registered passkey
   */
  .delete(
    "/passkeys/:id",
    async ({ params, headers, set }) => {
      const userId = getAuthUserId(headers);
      if (!userId) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      await db
        .delete(passkeys)
        .where(and(eq(passkeys.id, params.id), eq(passkeys.userId, userId)));

      return { message: "Passkey removed" };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.AUTH,
        summary: "Delete passkey",
        description: "Revokes a registered passkey credential.",
      }),
      params: t.Object({ id: t.String() }),
    }
  );
