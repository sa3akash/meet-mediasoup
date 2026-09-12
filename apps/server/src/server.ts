import "reflect-metadata";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./modules/auth";
import { meetingRoutes } from "./modules/meetings";
import { userRoutes } from "./modules/users";
import { webrtcRoutes } from "./modules/webrtc";
import { fileRoutes } from "./modules/files/file-routes";
import { notificationRoutes } from "./modules/notifications/notification-routes";
import { workerPool } from "./infrastructure/mediasoup/worker-pool";
import { redis } from "./infrastructure/redis";
import {
  handleSocketOpen,
  handleSocketClose,
  handleSocketMessage,
} from "./modules/signaling";
import { roomSockets } from "./modules/signaling/socket-registry";

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
  // Health & Readiness checks for Kubernetes Liveness & Readiness Probes
  .get("/health", () => ({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }))
  .get("/health/live", () => ({ status: "live", uptime: process.uptime() }))
  .get("/health/ready", async ({ set }) => {
    try {
      const redisPong = await redis.ping().catch(() => null);
      return {
        ready: true,
        services: {
          redis: redisPong === "PONG" ? "healthy" : "fallback-memory",
        },
        uptime: process.uptime(),
      };
    } catch (e: any) {
      set.status = 503;
      return { ready: false, error: e.message };
    }
  })
  .get("/ready", () => ({ ready: true }))
  // Mount Modular Domain Routes
  .use(authRoutes)
  .use(meetingRoutes)
  .use(userRoutes)
  .use(webrtcRoutes)
  .use(fileRoutes)
  .use(notificationRoutes)
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
  });

const server = app.listen(process.env.PORT || 4000);

console.log(`Enterprise Meet Server is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`WebSocket Signaling Gateway available at ws://${app.server?.hostname}:${app.server?.port}/ws`);
console.log(`OpenAPI Swagger Docs available at http://${app.server?.hostname}:${app.server?.port}/swagger`);

// Graceful Lifecycle Management for Kubernetes Pod Autoscaling & Rolling Updates
const handleShutdown = (signal: string) => {
  console.log(`[Server] Received ${signal}, gracefully draining WebSocket connections...`);
  try {
    roomSockets.forEach((sockets) => {
      sockets.forEach((ws) => {
        try {
          ws.send(JSON.stringify({ event: "server:shuttingDown", data: { message: "Pod rotating" } }));
          ws.close(1001, "Server pod rotating");
        } catch {}
      });
    });
    server.stop();
    console.log("[Server] Graceful shutdown complete.");
    process.exit(0);
  } catch (err) {
    console.error("[Server] Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

export type App = typeof app;
