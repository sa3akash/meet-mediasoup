import * as mediasoup from "mediasoup";
import type { Worker } from "mediasoup/types";
import { mediasoupConfig } from "./config";
import type { WorkerMetric } from "./types";
import fs from "fs";
import path from "path";

export type { WorkerMetric };

function hasNativeWorkerBinary(): boolean {
  const candidatePaths = [
    process.env.MEDIASOUP_WORKER_BIN,
    "/app/apps/server/node_modules/mediasoup/worker/out/Release/mediasoup-worker",
    "/app/node_modules/mediasoup/worker/out/Release/mediasoup-worker",
    path.resolve(process.cwd(), "apps/server/node_modules/mediasoup/worker/out/Release/mediasoup-worker"),
    path.resolve(process.cwd(), "node_modules/mediasoup/worker/out/Release/mediasoup-worker"),
    path.resolve(__dirname, "../../../../../node_modules/mediasoup/worker/out/Release/mediasoup-worker"),
    path.resolve(__dirname, "../../../node_modules/mediasoup/worker/out/Release/mediasoup-worker"),
  ];

  for (const candidate of candidatePaths) {
    if (!candidate) continue;
    if (fs.existsSync(candidate)) {
      process.env.MEDIASOUP_WORKER_BIN = candidate;
      return true;
    }
    if (fs.existsSync(`${candidate}.exe`)) {
      process.env.MEDIASOUP_WORKER_BIN = `${candidate}.exe`;
      return true;
    }
  }
  return false;
}

class WorkerPool {
  private workers: Worker[] = [];
  private workerRoutersCount = new Map<number, number>();

  public async initialize(): Promise<void> {
    if (!hasNativeWorkerBinary()) {
      console.warn(
        "[Mediasoup] Native C++ worker binary not compiled for local OS. Emulation mode active (native workers compile via Docker in production)."
      );
      this.initFallbackWorker();
      return;
    }

    const count = mediasoupConfig.numWorkers;
    console.log(`[Mediasoup] Initializing ${count} native worker instances using ${process.env.MEDIASOUP_WORKER_BIN}...`);

    for (let i = 0; i < count; i++) {
      await this.spawnWorker();
    }
  }

  private async spawnWorker(): Promise<Worker> {
    const worker = await mediasoup.createWorker({
      ...mediasoupConfig.workerSettings,
      workerBin: process.env.MEDIASOUP_WORKER_BIN,
    });
    this.workers.push(worker);
    this.workerRoutersCount.set(worker.pid, 0);

    worker.on("died", (error) => {
      console.error(`[Mediasoup] Worker ${worker.pid} died:`, error);
      this.workers = this.workers.filter((w) => w.pid !== worker.pid);
      this.workerRoutersCount.delete(worker.pid);
      this.spawnWorker().catch((err) => {
        console.error("[Mediasoup] Failed to resurrect dead worker:", err);
        if (this.workers.length === 0) {
          this.initFallbackWorker();
        }
      });
    });

    return worker;
  }

  private createMockWorker(pid: number): Worker {
    return {
      pid,
      getResourceUsage: async () => ({
        ru_utime: Math.floor(Math.random() * 50),
        ru_stime: Math.floor(Math.random() * 30),
        ru_maxrss: 24500 + Math.floor(Math.random() * 5000),
      }),
      createRouter: async ({ mediaCodecs }: any) => ({
        id: `dev-router-${pid}-${crypto.randomUUID().slice(0, 8)}`,
        rtpCapabilities: { codecs: mediaCodecs || mediasoupConfig.router.mediaCodecs, headerExtensions: [] },
        canConsume: () => true,
        createAudioLevelObserver: async () => ({ on: () => {}, addProducer: async () => {}, close: () => {} }),
        createWebRtcTransport: async (opts: any) => ({
          id: crypto.randomUUID(),
          iceParameters: { usernameFragment: "dev", password: "dev" },
          iceCandidates: [],
          dtlsParameters: { fingerprints: [{ algorithm: "sha-256", value: "dev" }], role: "auto" },
          appData: opts?.appData || {},
          connect: async () => {},
          produce: async ({ kind, appData }: any) => {
            let paused = false;
            return {
              id: crypto.randomUUID(),
              kind,
              appData: appData || {},
              paused,
              pause: async () => { paused = true; },
              resume: async () => { paused = false; },
              close: () => {},
              on: () => {},
            };
          },
          consume: async ({ producerId, rtpCapabilities }: any) => {
            let paused = false;
            return {
              id: crypto.randomUUID(),
              producerId,
              kind: "video",
              rtpParameters: { codecs: [] },
              type: "simulcast",
              paused,
              on: () => {},
              setPreferredLayers: async () => {},
              setMaxSpatialLayer: async () => {},
              pause: async () => { paused = true; },
              resume: async () => { paused = false; },
              close: () => {},
            };
          },
          restartIce: async () => ({ usernameFragment: "dev-restart", password: "dev-restart" }),
          on: () => {},
          close: () => {},
        }),
        observer: { on: () => {} },
        closed: false,
        close: () => {},
      }),
      on: () => {},
    } as unknown as Worker;
  }

  private initFallbackWorker(): void {
    const count = mediasoupConfig.numWorkers;
    this.workers = [];
    this.workerRoutersCount.clear();

    for (let i = 0; i < count; i++) {
      const pid = 99990 + i;
      const mockWorker = this.createMockWorker(pid);
      this.workers.push(mockWorker);
      this.workerRoutersCount.set(pid, 0);
    }
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
        metrics.push({ pid: worker.pid, routersCount: this.getRouterCount(worker.pid) });
      }
    }
    return metrics;
  }
}

export const workerPool = new WorkerPool();
