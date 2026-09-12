import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./modules/auth";
import { meetingRoutes } from "./modules/meetings";
import { userRoutes } from "./modules/users";
import { webrtcRoutes } from "./modules/webrtc";
import { workerPool } from "./infrastructure/mediasoup/worker-pool";
import {
  handleSocketOpen,
  handleSocketClose,
  handleSocketMessage,
} from "./modules/signaling";

// Initialize Mediasoup Worker Pool
try {
  await workerPool.initialize();
} catch (e) {
  console.warn("[Mediasoup] Local worker init warning (native worker binaries compiled via docker in prod):", e);
}

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
  }))
  .use(swagger({
    documentation: {
      info: {
        title: "Enterprise Video Meet API",
        version: "1.0.0",
        description: "Google Meet Style WebRTC & Conferencing Platform Backend",
      },
    },
  }) as any)
  // Health & Readiness checks
  .get("/health", () => ({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }))
  .get("/ready", () => ({ ready: true }))
  // Mount Modular Domain Routes
  .use(authRoutes)
  .use(meetingRoutes)
  .use(userRoutes)
  .use(webrtcRoutes)
  // Native WebSocket Signaling Endpoint
  .ws("/ws", {
    open(ws: any) {
      handleSocketOpen(ws);
    },
    message(ws: any, message: any) {
      handleSocketMessage(ws, message);
    },
    close(ws: any) {
      handleSocketClose(ws);
    },
  })
  .listen(process.env.PORT || 4000);

console.log(`Enterprise Meet Server is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`WebSocket Signaling Gateway available at ws://${app.server?.hostname}:${app.server?.port}/ws`);
console.log(`OpenAPI Swagger Docs available at http://${app.server?.hostname}:${app.server?.port}/swagger`);

export type App = typeof app;
