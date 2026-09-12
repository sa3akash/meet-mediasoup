import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { getOAuthRedirectUrl } from "../oauth";
import { hasRole } from "../rbac";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const oauthRouter = new Elysia()
  /**
   * Start OAuth Provider Flow
   */
  .get(
    "/oauth/:provider",
    ({ params, set,redirect }) => {
      const provider = params.provider as "google" | "github" | "microsoft";
      const state = crypto.randomUUID();
      const url = getOAuthRedirectUrl(provider, state);
      return redirect(url);
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "Start OAuth authorization",
      description: "Redirects user to external OAuth 2.0 provider (Google, GitHub, Microsoft).",
    })
  )

  /**
   * RBAC verification probe
   */
  .get(
    "/admin-only",
    async ({ headers, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader?.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };

      if (!decoded.role || !hasRole(decoded.role, ["ADMIN", "SUPER_ADMIN"])) {
        set.status = 403;
        return { error: "Forbidden: Requires ADMIN or SUPER_ADMIN role" };
      }

      return { message: "Authorized! Welcome to Admin Security Space." };
    },
    apiDoc({
      tag: SwaggerTags.AUTH,
      summary: "Admin RBAC test endpoint",
      description: "Validates caller JWT for ADMIN or SUPER_ADMIN role.",
    })
  );
