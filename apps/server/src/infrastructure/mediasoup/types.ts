import type { WebRtcTransport, Producer, Consumer, RtpCapabilities } from "mediasoup/node/lib/types";

export interface PeerMediaState {
  peerId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: RtpCapabilities;
}
