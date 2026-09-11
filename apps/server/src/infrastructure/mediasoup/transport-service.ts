import type { WebRtcTransport, DtlsParameters } from "mediasoup/node/lib/types";
import { workerPool } from "./worker-pool";
import { mediasoupConfig } from "./config";
import type { PeerMediaState } from "./types";

export async function createPeerTransport(
  meetingId: string,
  peer: PeerMediaState,
  direction: "send" | "recv"
) {
  const router = await workerPool.getOrCreateRouter(meetingId);
  const transport = await router.createWebRtcTransport({
    listenInfos: mediasoupConfig.webRtcTransport.listenInfos,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
    appData: { peerId: peer.peerId, direction },
  });

  peer.transports.set(transport.id, transport);

  transport.on("dtlsstatechange", (dtlsState) => {
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
