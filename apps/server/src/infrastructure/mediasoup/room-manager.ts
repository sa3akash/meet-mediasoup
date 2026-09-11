import type { RtpCapabilities, RtpParameters, DtlsParameters, MediaKind, Consumer } from "mediasoup/node/lib/types";
import { routerBalancer } from "./router-balancer";
import { audioObserverService } from "./audio-observer-service";
import { layerManager, type LayerOptions } from "./layer-manager";
import { createPeerTransport, connectPeerTransport, restartPeerIce } from "./transport-service";
import type { PeerMediaState } from "./types";

class MediasoupRoomManager {
  private rooms = new Map<string, Map<string, PeerMediaState>>();

  public async getRouterCapabilities(meetingId: string): Promise<RtpCapabilities> {
    const router = await routerBalancer.getOrCreateRouter(meetingId);
    await audioObserverService.setupObserver(meetingId, router);
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
      peer = { peerId, transports: new Map(), producers: new Map(), consumers: new Map() };
      room.set(peerId, peer);
    }
    return peer;
  }

  public async createWebRtcTransport(meetingId: string, peerId: string, direction: "send" | "recv") {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    return await createPeerTransport(meetingId, peer, direction);
  }

  public async connectTransport(meetingId: string, peerId: string, transportId: string, dtlsParameters: DtlsParameters) {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    await connectPeerTransport(peer, transportId, dtlsParameters);
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

    const producer = await transport.produce({ kind, rtpParameters, appData: { ...appData, peerId } });
    peer.producers.set(producer.id, producer);

    if (kind === "audio") {
      await audioObserverService.addAudioProducer(meetingId, producer);
    }

    producer.on("transportclose", () => peer.producers.delete(producer.id));
    return producer.id;
  }

  public async consume(meetingId: string, consumerPeerId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
    const router = await routerBalancer.getOrCreateRouter(meetingId);
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Cannot consume producer ${producerId}`);
    }

    const peer = this.getOrCreatePeer(meetingId, consumerPeerId);
    const recvTransport = Array.from(peer.transports.values()).find((t) => (t.appData as any)?.direction === "recv");
    if (!recvTransport) throw new Error(`No recv transport for peer ${consumerPeerId}`);

    const consumer = await recvTransport.consume({ producerId, rtpCapabilities, paused: false });
    peer.consumers.set(consumer.id, consumer);

    consumer.on("transportclose", () => peer.consumers.delete(consumer.id));
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

  public async setConsumerLayers(meetingId: string, peerId: string, consumerId: string, options: LayerOptions) {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    const consumer = peer.consumers.get(consumerId);
    if (consumer) {
      await layerManager.setPreferredLayers(consumer, options);
    }
  }

  public async restartIce(meetingId: string, peerId: string, transportId: string) {
    const peer = this.getOrCreatePeer(meetingId, peerId);
    return await restartPeerIce(peer, transportId);
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
      audioObserverService.removeObserver(meetingId);
      routerBalancer.closeRouter(meetingId);
    }
  }

  public getRoomProducers(meetingId: string, excludePeerId?: string) {
    const room = this.rooms.get(meetingId);
    if (!room) return [];
    const list: Array<{ producerId: string; peerId: string; kind: MediaKind; appData: any }> = [];
    room.forEach((peerState, peerId) => {
      if (peerId === excludePeerId) return;
      peerState.producers.forEach((producer) => {
        list.push({ producerId: producer.id, peerId, kind: producer.kind, appData: producer.appData });
      });
    });
    return list;
  }
}

export const roomManager = new MediasoupRoomManager();
