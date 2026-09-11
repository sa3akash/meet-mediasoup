import * as mediasoup from "mediasoup";
import type { Worker, Router, AudioLevelObserver } from "mediasoup/node/lib/types";
import { mediasoupConfig } from "./config";

class WorkerPool {
  private workers: Worker[] = [];
  private nextWorkerIdx = 0;
  private routers = new Map<string, Router>();
  private audioObservers = new Map<string, AudioLevelObserver>();

  public async initialize(): Promise<void> {
    const count = mediasoupConfig.numWorkers;
    console.log(`[Mediasoup] Initializing ${count} worker instances...`);

    for (let i = 0; i < count; i++) {
      const worker = await mediasoup.createWorker(mediasoupConfig.workerSettings);

      worker.on("died", (error) => {
        console.error(`[Mediasoup] Worker ${worker.pid} died:`, error);
        this.workers = this.workers.filter((w) => w.pid !== worker.pid);
        // Spin up replacement worker
        mediasoup.createWorker(mediasoupConfig.workerSettings).then((newWorker) => {
          this.workers.push(newWorker);
        });
      });

      this.workers.push(worker);
    }
  }

  public getNextWorker(): Worker {
    if (this.workers.length === 0) {
      throw new Error("No mediasoup workers available in pool");
    }
    const worker = this.workers[this.nextWorkerIdx];
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  public async getOrCreateRouter(roomId: string): Promise<Router> {
    let router = this.routers.get(roomId);
    if (!router) {
      const worker = this.getNextWorker();
      router = await worker.createRouter({ mediaCodecs: mediasoupConfig.router.mediaCodecs });
      this.routers.set(roomId, router);

      // Create AudioLevelObserver for active speaker detection
      const audioObserver = await router.createAudioLevelObserver({
        maxEntries: 1,
        threshold: -60, // dBov
        interval: 400, // ms
      });
      this.audioObservers.set(roomId, audioObserver);

      router.observer.on("close", () => {
        this.routers.delete(roomId);
        this.audioObservers.delete(roomId);
      });
    }
    return router;
  }

  public getAudioObserver(roomId: string): AudioLevelObserver | undefined {
    return this.audioObservers.get(roomId);
  }

  public closeRouter(roomId: string): void {
    const router = this.routers.get(roomId);
    if (router && !router.closed) {
      router.close();
    }
    this.routers.delete(roomId);
    this.audioObservers.delete(roomId);
  }
}

export const workerPool = new WorkerPool();
