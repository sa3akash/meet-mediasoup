export interface ConsumerLayerRequest {
  consumerId: string;
  spatialLayer: number;
  temporalLayer?: number;
}

export class AdaptiveBitrateManager {
  private sendRequest: (method: string, data?: any) => Promise<any>;

  constructor(sendRequest: (method: string, data?: any) => Promise<any>) {
    this.sendRequest = sendRequest;
  }

  public async setQuality(consumerId: string, quality: "high" | "medium" | "low"): Promise<void> {
    let spatialLayer = 2;
    if (quality === "medium") spatialLayer = 1;
    if (quality === "low") spatialLayer = 0;

    try {
      await this.sendRequest("webrtc:setConsumerLayers", {
        consumerId,
        spatialLayer,
        temporalLayer: 2,
      });
    } catch (err) {
      console.warn(`[ABR] Failed to set layer for ${consumerId}:`, err);
    }
  }

  public async prioritizeActiveSpeaker(
    activeProducerId: string,
    consumerMap: Map<string, { producerId: string; consumerId: string }>
  ): Promise<void> {
    for (const [, item] of consumerMap) {
      if (item.producerId === activeProducerId) {
        await this.setQuality(item.consumerId, "high");
      } else {
        await this.setQuality(item.consumerId, "low");
      }
    }
  }
}
