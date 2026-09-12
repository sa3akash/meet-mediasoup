import { Elysia } from "elysia";
import { adminOverviewRoutes } from "./routes/overview-routes";
import { adminUsersRoutes } from "./routes/users-routes";
import { adminMeetingsRoutes } from "./routes/meetings-routes";

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(adminOverviewRoutes)
  .use(adminUsersRoutes)
  .use(adminMeetingsRoutes);
