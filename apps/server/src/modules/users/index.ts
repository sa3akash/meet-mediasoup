import { Elysia } from "elysia";
import { profileRouter } from "./routes/profile";
import { mediaRouter } from "./routes/media";
import { preferencesRouter } from "./routes/preferences";
import { presenceRouter } from "./routes/presence";

export const userRoutes = new Elysia({ prefix: "/api/users" })
  .use(profileRouter)
  .use(mediaRouter)
  .use(preferencesRouter)
  .use(presenceRouter);
