import * as mediasoup from "mediasoup";
import type { Worker } from "mediasoup/node/lib/types";
import { mediasoupConfig } from "./config";

export interface WorkerMetric {
  pid: number;
  routersCount: number;
  ru_utime?: number;
  ru_stime?: number;
  ru_maxrss?: number;
}

class WorkerPool {
  private workers: Worker[] = [];
  private workerRoutersCount = new Map<number, number>();

  public async initialize(): Promise<void> {
    const count = mediasoupConfig.numWorkers;
    console.log(`[Mediasoup] Initializing ${count} worker instances...`);

    for (let i = 0; i < count; i++) {
      await this.spawnWorker();
    }
  }

  private async spawnWorker(): Promise<Worker> {
    const worker = await mediasoup.createWorker(mediasoupConfig.workerSettings);
    this.workers.push(worker);
    this.workerRoutersCount.set(worker.pid, 0);

    worker.on("died", (error) => {
      console.error(`[Mediasoup] Worker ${worker.pid} died:`, error);
      this.workers = this.workers.filter((w) => w.pid !== worker.pid);
      this.workerRoutersCount.delete(worker.pid);
      // Automatically respawn replacement worker
      this.spawnWorker().catch((err) => console.error("Failed to respawn worker:", err));
    });

    return worker;
  }

  public getWorkers(): Worker[] {
    return this.workers;
  }

  public getRouterCount(pid: number): number {
    return this.workerRoutersCount.get(pid) || 0;
  }

  public incrementRouterCount(pid: number): void {
    this.workerRoutersCount.set(pid, this.getRouterCount(pid) + 1);
  }

  public decrementRouterCount(pid: number): void {
    const count = this.getRouterCount(pid);
    if (count > 0) this.workerRoutersCount.set(pid, count - 1);
  }

  public async getWorkerMetrics(): Promise<WorkerMetric[]> {
    const metrics: WorkerMetric[] = [];
    for (const worker of this.workers) {
      try {
        const usage = await worker.getResourceUsage();
        metrics.push({
          pid: worker.pid,
          routersCount: this.getRouterCount(worker.pid),
          ru_utime: usage.ru_utime,
          ru_stime: usage.ru_stime,
          ru_maxrss: usage.ru_maxrss,
        });
      } catch {
        metrics.push({
          pid: worker.pid,
          routersCount: this.getRouterCount(worker.pid),
        });
      }
    }
    return metrics;
  }
}

export const workerPool = new WorkerPool();
