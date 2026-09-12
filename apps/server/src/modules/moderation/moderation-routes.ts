import { Elysia } from "elysia";
import { reportsRoutes } from "./routes/reports-routes";
import { actionsRoutes } from "./routes/actions-routes";

export const moderationRoutes = new Elysia({ prefix: "/api/moderation" })
  .use(reportsRoutes)
  .use(actionsRoutes);
