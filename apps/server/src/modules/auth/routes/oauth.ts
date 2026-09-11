import { Elysia } from "elysia";
import jwt from "jsonwebtoken";
import { getOAuthRedirectUrl } from "../oauth";
import { hasRole } from "../rbac";

const JWT_SECRET = process.env.JWT_SECRET || "enterprise-super-secret-jwt-key";

export const oauthRouter = new Elysia()
  .get("/oauth/:provider", ({ params, set }) => {
    const provider = params.provider as "google" | "github" | "microsoft";
    const state = crypto.randomUUID();
    const url = getOAuthRedirectUrl(provider, state);
    set.redirect = url;
  })
  .get("/admin-only", async ({ headers, set }) => {
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
  });
