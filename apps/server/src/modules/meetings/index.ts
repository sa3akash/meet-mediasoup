import { Elysia } from "elysia";
import { crudRoutes } from "./routes/crud";
import { settingsRoutes } from "./routes/settings";
import { personalRoomRoutes } from "./routes/personal-room";
import { templatesRoutes } from "./routes/templates";
import { waitingRoomRoutes } from "./routes/waiting-room";

export const meetingRoutes = new Elysia({ prefix: "/api/meetings" })
  .use(crudRoutes)
  .use(settingsRoutes)
  .use(personalRoomRoutes)
  .use(templatesRoutes)
  .use(waitingRoomRoutes);
