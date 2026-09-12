import { Elysia } from "elysia";
import { workerPool } from "../../infrastructure/mediasoup/worker-pool";
import { routerBalancer } from "../../infrastructure/mediasoup/router-balancer";

export const webrtcRoutes = new Elysia({ prefix: "/api/webrtc" })
  .get("/workers", async () => {
    const workers = await workerPool.getWorkerMetrics();
    const activeRooms = routerBalancer.getActiveRooms();
    const roomDistribution = routerBalancer.getRoomDistribution();

    return {
      status: "ok",
      totalWorkers: workers.length,
      workers,
      activeRoomsCount: activeRooms.length,
      activeRooms,
      roomDistribution,
      timestamp: new Date().toISOString(),
    };
  });
