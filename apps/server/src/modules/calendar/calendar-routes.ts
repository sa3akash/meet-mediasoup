import { Elysia } from "elysia";
import { calendarEventsRoutes } from "./routes/calendar-events-routes";
import { calendarSyncRoutes } from "./routes/calendar-sync-routes";

export const calendarRoutes = new Elysia({ prefix: "/api/calendar" })
  .use(calendarEventsRoutes)
  .use(calendarSyncRoutes);
