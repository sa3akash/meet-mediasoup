import type { DtlsParameters, DtlsState } from "mediasoup/types";
import { routerBalancer } from "./router-balancer";
import { mediasoupConfig } from "./config";
import type { PeerMediaState } from "./types";

export async function createPeerTransport(
  meetingId: string,
  peer: PeerMediaState,
  direction: "send" | "recv"
) {
  const router = await routerBalancer.getOrCreateRouter(meetingId);
  const transport = await router.createWebRtcTransport({
    listenInfos: mediasoupConfig.webRtcTransport.listenInfos,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
    appData: { peerId: peer.peerId, direction },
  });

  if (mediasoupConfig.webRtcTransport.maxIncomingBitrate) {
    try {
      await transport.setMaxIncomingBitrate(mediasoupConfig.webRtcTransport.maxIncomingBitrate);
    } catch (err) {
      console.warn("[Mediasoup] Warning setting maxIncomingBitrate:", err);
    }
  }

  peer.transports.set(transport.id, transport);

  transport.on("dtlsstatechange", (dtlsState: DtlsState) => {
    if (dtlsState === "closed" || dtlsState === "failed") {
      transport.close();
    }
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

export async function connectPeerTransport(
  peer: PeerMediaState,
  transportId: string,
  dtlsParameters: DtlsParameters
) {
  const transport = peer.transports.get(transportId);
  if (!transport) throw new Error(`Transport ${transportId} not found`);
  await transport.connect({ dtlsParameters });
}

export async function restartPeerIce(peer: PeerMediaState, transportId: string) {
  const transport = peer.transports.get(transportId);
  if (!transport) throw new Error(`Transport ${transportId} not found`);
  return await transport.restartIce();
}
