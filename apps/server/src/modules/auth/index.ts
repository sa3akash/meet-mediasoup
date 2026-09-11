import { Elysia } from "elysia";
import { signupRouter } from "./routes/signup";
import { loginRouter } from "./routes/login";
import { tokenRouter } from "./routes/token";
import { passwordRouter } from "./routes/password";
import { sessionsRouter } from "./routes/sessions";
import { passkeysRouter } from "./routes/passkeys";
import { oauthRouter } from "./routes/oauth";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(signupRouter)
  .use(loginRouter)
  .use(tokenRouter)
  .use(passwordRouter)
  .use(sessionsRouter)
  .use(passkeysRouter)
  .use(oauthRouter);
