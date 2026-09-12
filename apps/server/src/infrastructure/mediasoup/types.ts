import type { WebRtcTransport, Producer, Consumer, RtpCapabilities } from "mediasoup/types";

export interface PeerMediaState {
  peerId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: RtpCapabilities;
}

export interface WorkerMetric {
  pid: number;
  routersCount: number;
  ru_utime?: number;
  ru_stime?: number;
  ru_maxrss?: number;
}

export interface LayerOptions {
  spatialLayer: number;
  temporalLayer?: number;
}

