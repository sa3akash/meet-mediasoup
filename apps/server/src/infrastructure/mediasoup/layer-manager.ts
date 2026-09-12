import type { Consumer } from "mediasoup/types";
import type { LayerOptions } from "./types";

export type { LayerOptions };

class LayerManager {
  public async setPreferredLayers(consumer: Consumer, options: LayerOptions): Promise<void> {
    if (consumer.type !== "simulcast" && consumer.type !== "svc") {
      return;
    }
    await consumer.setPreferredLayers({
      spatialLayer: options.spatialLayer,
      temporalLayer: options.temporalLayer,
    });
  }

  public async setMaxSpatialLayer(consumer: Consumer, spatialLayer: number): Promise<void> {
    if (consumer.type === "simulcast" || consumer.type === "svc") {
      if (typeof (consumer as any).setMaxSpatialLayer === "function") {
        await (consumer as any).setMaxSpatialLayer(spatialLayer);
      } else {
        await consumer.setPreferredLayers({ spatialLayer });
      }
    }
  }

  public async pauseConsumer(consumer: Consumer): Promise<void> {
    if (!consumer.paused) {
      await consumer.pause();
    }
  }

  public async resumeConsumer(consumer: Consumer): Promise<void> {
    if (consumer.paused) {
      await consumer.resume();
    }
  }
}

export const layerManager = new LayerManager();
