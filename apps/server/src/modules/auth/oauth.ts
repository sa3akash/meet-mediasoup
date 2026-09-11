import { db } from "../../infrastructure/database";
import { accounts, users } from "../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq, and } from "drizzle-orm";

export interface OAuthUserProfile {
  provider: "google" | "github" | "microsoft";
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export function getOAuthRedirectUrl(provider: "google" | "github" | "microsoft", state: string): string {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const callbackUrl = `${process.env.API_URL || "http://localhost:4000"}/api/auth/oauth/${provider}/callback`;

  switch (provider) {
    case "google": {
      const clientId = process.env.GOOGLE_CLIENT_ID || "";
      const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      const options = {
        redirect_uri: callbackUrl,
        client_id: clientId,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"].join(" "),
        state,
      };
      return `${rootUrl}?${new URLSearchParams(options).toString()}`;
    }
    case "github": {
      const clientId = process.env.GITHUB_CLIENT_ID || "";
      const rootUrl = "https://github.com/login/oauth/authorize";
      const options = {
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: "read:user user:email",
        state,
      };
      return `${rootUrl}?${new URLSearchParams(options).toString()}`;
    }
    case "microsoft": {
      const clientId = process.env.MICROSOFT_CLIENT_ID || "";
      const rootUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
      const options = {
        client_id: clientId,
        response_type: "code",
        redirect_uri: callbackUrl,
        response_mode: "query",
        scope: "openid profile email User.Read",
        state,
      };
      return `${rootUrl}?${new URLSearchParams(options).toString()}`;
    }
  }
}

export async function handleOAuthUser(profile: OAuthUserProfile, tokens: { accessToken?: string; refreshToken?: string }) {
  // Check if account link exists
  const existingAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.provider, profile.provider),
      eq(accounts.providerAccountId, profile.providerAccountId)
    ),
    with: {
      user: true,
    },
  });

  if (existingAccount && existingAccount.user) {
    return existingAccount.user;
  }

  // Check if user with this email already exists
  let user = await db.query.users.findFirst({
    where: eq(users.email, profile.email.toLowerCase()),
  });

  if (!user) {
    // Create new user
    const [created] = await db
      .insert(users)
      .values({
        id: generateUUIDv7(),
        email: profile.email.toLowerCase(),
        name: profile.name || "Meet User",
        avatarUrl: profile.avatarUrl || null,
        isVerified: true, // OAuth providers verify emails
      })
      .returning();
    user = created;
  }

  // Link account
  await db.insert(accounts).values({
    id: generateUUIDv7(),
    userId: user.id,
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
    accessToken: tokens.accessToken || null,
    refreshToken: tokens.refreshToken || null,
  });

  return user;
}
