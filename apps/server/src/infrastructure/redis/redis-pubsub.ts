import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const NODE_ID = "node-" + crypto.randomUUID().slice(0, 8);

let isPubSubActive = false;

export const redisPub = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 3000),
  enableReadyCheck: false,
  lazyConnect: true,
});

export const redisSub = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 3000),
  enableReadyCheck: false,
  lazyConnect: true,
});

redisPub.on("connect", () => {
  isPubSubActive = true;
});

redisPub.on("error", () => {
  isPubSubActive = false;
});

redisSub.on("error", () => {});

// Connect both non-blocking
redisPub.connect().catch(() => {});
redisSub.connect().catch(() => {});

type RoomCallback = (payload: { event: string; data: any; excludeParticipantId?: string }) => void;
type ParticipantCallback = (payload: any) => void;

const roomListeners = new Map<string, Set<RoomCallback>>();
const participantListeners = new Map<string, Set<ParticipantCallback>>();

redisSub.on("message", (channel, message) => {
  try {
    const parsed = JSON.parse(message);
    if (!parsed || parsed.originNodeId === NODE_ID) {
      return; // Ignore messages originating from this node to prevent duplicate local delivery
    }

    if (channel.startsWith("meet:room:")) {
      const meetingId = channel.replace("meet:room:", "");
      const listeners = roomListeners.get(meetingId);
      if (listeners) {
        listeners.forEach((cb) => cb(parsed.payload));
      }
    } else if (channel.startsWith("meet:participant:")) {
      const participantId = channel.replace("meet:participant:", "");
      const listeners = participantListeners.get(participantId);
      if (listeners) {
        listeners.forEach((cb) => cb(parsed.payload));
      }
    }
  } catch (err) {
    console.warn("[RedisPubSub] Failed to parse pubsub message:", err);
  }
});

export async function publishRoomEvent(
  meetingId: string,
  payload: { event: string; data: any },
  excludeParticipantId?: string
): Promise<void> {
  if (!isPubSubActive) return;
  try {
    const channel = `meet:room:${meetingId}`;
    const envelope = JSON.stringify({
      originNodeId: NODE_ID,
      payload: {
        ...payload,
        excludeParticipantId,
      },
    });
    await redisPub.publish(channel, envelope);
  } catch (err) {
    console.warn("[RedisPubSub] Failed to publish room event:", err);
  }
}

export async function publishParticipantEvent(
  targetParticipantId: string,
  payload: any
): Promise<void> {
  if (!isPubSubActive) return;
  try {
    const channel = `meet:participant:${targetParticipantId}`;
    const envelope = JSON.stringify({
      originNodeId: NODE_ID,
      payload,
    });
    await redisPub.publish(channel, envelope);
  } catch (err) {
    console.warn("[RedisPubSub] Failed to publish participant event:", err);
  }
}

export async function subscribeToRoom(meetingId: string, callback: RoomCallback): Promise<void> {
  let listeners = roomListeners.get(meetingId);
  const isFirst = !listeners;
  if (!listeners) {
    listeners = new Set();
    roomListeners.set(meetingId, listeners);
  }
  listeners.add(callback);

  if (isFirst && isPubSubActive) {
    try {
      await redisSub.subscribe(`meet:room:${meetingId}`);
    } catch {}
  }
}

export async function unsubscribeFromRoom(meetingId: string, callback?: RoomCallback): Promise<void> {
  const listeners = roomListeners.get(meetingId);
  if (listeners) {
    if (callback) {
      listeners.delete(callback);
    }
    if (!callback || listeners.size === 0) {
      roomListeners.delete(meetingId);
      if (isPubSubActive) {
        try {
          await redisSub.unsubscribe(`meet:room:${meetingId}`);
        } catch {}
      }
    }
  }
}

export async function subscribeToParticipant(
  participantId: string,
  callback: ParticipantCallback
): Promise<void> {
  let listeners = participantListeners.get(participantId);
  const isFirst = !listeners;
  if (!listeners) {
    listeners = new Set();
    participantListeners.set(participantId, listeners);
  }
  listeners.add(callback);

  if (isFirst && isPubSubActive) {
    try {
      await redisSub.subscribe(`meet:participant:${participantId}`);
    } catch {}
  }
}

export async function unsubscribeFromParticipant(
  participantId: string,
  callback?: ParticipantCallback
): Promise<void> {
  const listeners = participantListeners.get(participantId);
  if (listeners) {
    if (callback) {
      listeners.delete(callback);
    }
    if (!callback || listeners.size === 0) {
      participantListeners.delete(participantId);
      if (isPubSubActive) {
        try {
          await redisSub.unsubscribe(`meet:participant:${participantId}`);
        } catch {}
      }
    }
  }
}
