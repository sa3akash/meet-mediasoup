import { Elysia } from "elysia";
import { workerPool } from "../../infrastructure/mediasoup/worker-pool";
import { routerBalancer } from "../../infrastructure/mediasoup/router-balancer";
import { apiDoc, SwaggerTags } from "../../infrastructure/swagger/swagger-helpers";

export const webrtcRoutes = new Elysia({ prefix: "/api/webrtc" })
  .get(
    "/workers",
    async () => {
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
    },
    apiDoc({
      tag: SwaggerTags.WEBRTC,
      summary: "Get WebRTC worker metrics",
      description: "Returns Mediasoup worker load, process metrics, and active room distribution.",
    })
  );

