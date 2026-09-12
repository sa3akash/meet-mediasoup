import type { Router, Worker } from "mediasoup/types";
import { workerPool } from "./worker-pool";
import { mediasoupConfig } from "./config";

class RouterBalancer {
  private roomRouters = new Map<string, { router: Router; workerPid: number }>();

  public getLeastLoadedWorker(): Worker {
    const workers = workerPool.getWorkers();
    if (workers.length === 0) {
      throw new Error("No mediasoup workers available in pool");
    }

    let leastLoaded = workers[0];
    let minRouters = workerPool.getRouterCount(leastLoaded.pid);

    for (let i = 1; i < workers.length; i++) {
      const current = workers[i];
      const count = workerPool.getRouterCount(current.pid);
      if (count < minRouters) {
        minRouters = count;
        leastLoaded = current;
      }
    }
    return leastLoaded;
  }

  public async getOrCreateRouter(roomId: string): Promise<Router> {
    const existing = this.roomRouters.get(roomId);
    if (existing && !existing.router.closed) {
      return existing.router;
    }

    const worker = this.getLeastLoadedWorker();
    const router = await worker.createRouter({
      mediaCodecs: mediasoupConfig.router.mediaCodecs,
    });

    workerPool.incrementRouterCount(worker.pid);
    this.roomRouters.set(roomId, { router, workerPid: worker.pid });

    router.observer.on("close", () => {
      workerPool.decrementRouterCount(worker.pid);
      this.roomRouters.delete(roomId);
    });

    return router;
  }

  public closeRouter(roomId: string): void {
    const entry = this.roomRouters.get(roomId);
    if (entry && !entry.router.closed) {
      entry.router.close();
    }
    this.roomRouters.delete(roomId);
  }

  public getActiveRooms(): string[] {
    return Array.from(this.roomRouters.keys());
  }

  public getRoomDistribution(): Array<{ roomId: string; workerPid: number }> {
    return Array.from(this.roomRouters.entries()).map(([roomId, entry]) => ({
      roomId,
      workerPid: entry.workerPid,
    }));
  }
}

export const routerBalancer = new RouterBalancer();

