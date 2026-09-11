import type {
  WebRtcTransport,
  Producer,
  Consumer,
  RtpCapabilities,
  RtpParameters,
  DtlsParameters,
  MediaKind,
} from "mediasoup/node/lib/types";
import { workerPool } from "./worker-pool";
import { mediasoupConfig } from "./config";

export interface PeerMediaState {
  peerId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  rtpCapabilities?: RtpCapabilities;
}

class MediasoupRoomManager {
  // Map of meetingId -> Map of peerId -> PeerMediaState
  private rooms = new Map<string, Map<string, PeerMediaState>>();

  public async getRouterCapabilities(meetingId: string): Promise<RtpCapabilities> {
    const router = await workerPool.getOrCreateRouter(meetingId);
    return router.rtpCapabilities;
  }

  public getOrCreatePeer(meetingId: string, peerId: string): PeerMediaState {
    let room = this.rooms.get(meetingId);
    if (!room) {
      room = new Map();
      this.rooms.set(meetingId, room);
    }
    let peer = room.get(peerId);
    if (!peer) {
      peer = {
        peerId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
      };
      room.set(peerId, peer);
    }
    return peer;
  }

  public async createWebRtcTransport(
    meetingId: string,
    peerId: string,
    direction: "send" | "recv"
  ): Promise<{
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
  }> {
    const router = await workerPool.getOrCreateRouter(meetingId);
    const transport = await router.createWebRtcTransport({
      listenInfos: mediasoupConfig.webRtcTransport.listenInfos,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: mediasoupConfig.webRtcTransport.initialAvailableOutgoingBitrate,
      appData: { peerId, direction },
    });

    const peer = this.getOrCreatePeer(meetingId, peerId);
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

  public async connectTransport(
    meetingId: string,
    peerId: string,
    transportId: string,
    dtlsParameters: DtlsParameters
  ): Promise<void> {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);
    await transport.connect({ dtlsParameters });
  }

  public async produce(
    meetingId: string,
    peerId: string,
    transportId: string,
    kind: MediaKind,
    rtpParameters: RtpParameters,
    appData: Record<string, any>
  ): Promise<string> {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    const producer = await transport.produce({
      kind,
      rtpParameters,
      appData: { ...appData, peerId },
    });

    peer.producers.set(producer.id, producer);

    // If audio, attach to AudioLevelObserver for active speaker detection
    if (kind === "audio") {
      const observer = workerPool.getAudioObserver(meetingId);
      if (observer) {
        await observer.addProducer({ producerId: producer.id });
      }
    }

    producer.on("transportclose", () => {
      peer.producers.delete(producer.id);
    });

    return producer.id;
  }

  public async consume(
    meetingId: string,
    consumerPeerId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ): Promise<{
    id: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    type: string;
  }> {
    const router = await workerPool.getOrCreateRouter(meetingId);
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Cannot consume producer ${producerId}`);
    }

    const peer = this.getOrCreatePeer(meetingId, consumerPeerId);
    // Find recv transport
    const recvTransport = Array.from(peer.transports.values()).find(
      (t) => (t.appData as any)?.direction === "recv"
    );
    if (!recvTransport) {
      throw new Error(`No recv transport found for peer ${consumerPeerId}`);
    }

    const consumer = await recvTransport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    peer.consumers.set(consumer.id, consumer);

    consumer.on("transportclose", () => {
      peer.consumers.delete(consumer.id);
    });
    consumer.on("producerclose", () => {
      peer.consumers.delete(consumer.id);
      consumer.close();
    });

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
    };
  }

  public async restartIce(meetingId: string, peerId: string, transportId: string) {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);
    return await transport.restartIce();
  }

  public removePeer(meetingId: string, peerId: string): void {
    const room = this.rooms.get(meetingId);
    if (!room) return;
    const peer = room.get(peerId);
    if (peer) {
      peer.transports.forEach((t) => t.close());
      peer.producers.forEach((p) => p.close());
      peer.consumers.forEach((c) => c.close());
      room.delete(peerId);
    }
    if (room.size === 0) {
      this.rooms.delete(meetingId);
      workerPool.closeRouter(meetingId);
    }
  }

  public getRoomProducers(meetingId: string, excludePeerId?: string): Array<{ producerId: string; peerId: string; kind: MediaKind; appData: any }> {
    const room = this.rooms.get(meetingId);
    if (!room) return [];
    const list: Array<{ producerId: string; peerId: string; kind: MediaKind; appData: any }> = [];
    room.forEach((peerState, peerId) => {
      if (peerId === excludePeerId) return;
      peerState.producers.forEach((producer) => {
        list.push({
          producerId: producer.id,
          peerId,
          kind: producer.kind,
          appData: producer.appData,
        });
      });
    });
    return list;
  }
}

export const roomManager = new MediasoupRoomManager();
