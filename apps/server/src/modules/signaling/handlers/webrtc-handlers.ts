import type { ServerWebSocket } from "bun";
import { roomManager } from "../../../infrastructure/mediasoup/room-manager";
import { workerPool } from "../../../infrastructure/mediasoup/worker-pool";
import { type SocketData, sendResponse, broadcastToRoom } from "../socket-registry";

export async function handleWebRtcMessage(
  ws: ServerWebSocket<SocketData>,
  id: string,
  method: string,
  data: any
): Promise<boolean> {
  const meetingId = ws.data.meetingId;
  const participantId = ws.data.participantId;
  if (!meetingId || !participantId) return false;

  switch (method) {
    case "webrtc:createWebRtcTransport": {
      const { direction } = data;
      const transportParams = await roomManager.createWebRtcTransport(meetingId, participantId, direction);
      sendResponse(ws, id, transportParams);
      return true;
    }

    case "webrtc:connectWebRtcTransport": {
      const { transportId, dtlsParameters } = data;
      await roomManager.connectTransport(meetingId, participantId, transportId, dtlsParameters);
      sendResponse(ws, id, { connected: true });
      return true;
    }

    case "webrtc:produce": {
      const { transportId, kind, rtpParameters, appData } = data;
      const producerId = await roomManager.produce(
        meetingId,
        participantId,
        transportId,
        kind,
        rtpParameters,
        appData
      );
      sendResponse(ws, id, { id: producerId });

      broadcastToRoom(meetingId, {
        event: "webrtc:newProducer",
        data: { producerId, producerPeerId: participantId, kind, appData },
      }, ws);
      return true;
    }

    case "webrtc:consume": {
      const { producerId, rtpCapabilities } = data;
      const consumeParams = await roomManager.consume(meetingId, participantId, producerId, rtpCapabilities);
      sendResponse(ws, id, consumeParams);
      return true;
    }

    case "webrtc:restartIce": {
      const { transportId } = data;
      const iceParameters = await roomManager.restartIce(meetingId, participantId, transportId);
      sendResponse(ws, id, { iceParameters });
      return true;
    }

    case "webrtc:setConsumerLayers": {
      const { consumerId, spatialLayer, temporalLayer } = data;
      await roomManager.setConsumerLayers(meetingId, participantId, consumerId, {
        spatialLayer,
        temporalLayer,
      });
      sendResponse(ws, id, { updated: true });
      return true;
    }

    case "webrtc:pauseProducer": {
      const { producerId } = data;
      await roomManager.pauseProducer(meetingId, participantId, producerId);
      sendResponse(ws, id, { paused: true });
      broadcastToRoom(meetingId, {
        event: "webrtc:producerPaused",
        data: { producerId, producerPeerId: participantId },
      }, ws);
      return true;
    }

    case "webrtc:resumeProducer": {
      const { producerId } = data;
      await roomManager.resumeProducer(meetingId, participantId, producerId);
      sendResponse(ws, id, { resumed: true });
      broadcastToRoom(meetingId, {
        event: "webrtc:producerResumed",
        data: { producerId, producerPeerId: participantId },
      }, ws);
      return true;
    }

    case "webrtc:closeProducer": {
      const { producerId } = data;
      await roomManager.closeProducer(meetingId, participantId, producerId);
      sendResponse(ws, id, { closed: true });
      broadcastToRoom(meetingId, {
        event: "webrtc:producerClosed",
        data: { producerId, producerPeerId: participantId },
      }, ws);
      return true;
    }

    case "webrtc:getWorkerStats": {
      const metrics = await workerPool.getWorkerMetrics();
      sendResponse(ws, id, { workers: metrics });
      return true;
    }

    default:
      return false;
  }
}
