import { Elysia } from "elysia";
import { crudRoutes } from "./routes/crud";
import { accessRoutes } from "./routes/access";
import { settingsRoutes } from "./routes/settings";
import { controlsRoutes } from "./routes/controls";
import { personalRoomRoutes } from "./routes/personal-room";
import { templatesRoutes } from "./routes/templates";
import { waitingRoomRoutes } from "./routes/waiting-room";

export const meetingRoutes = new Elysia({ prefix: "/api/meetings" })
  .use(crudRoutes)
  .use(accessRoutes)
  .use(settingsRoutes)
  .use(controlsRoutes)
  .use(personalRoomRoutes)
  .use(templatesRoutes)
  .use(waitingRoomRoutes);
