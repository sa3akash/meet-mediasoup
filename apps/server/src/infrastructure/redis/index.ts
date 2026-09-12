import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
let isRedisAvailable = false;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // don't spam retries on local if redis daemon is not running
  enableReadyCheck: false,
  lazyConnect: true,
});

export const redisSub = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on("connect", () => { isRedisAvailable = true; });
redis.on("error", () => { isRedisAvailable = false; });
redisSub.on("error", () => {});

// Attempt connection non-blocking
redis.connect().catch(() => {});
redisSub.connect().catch(() => {});

// In-Memory Fallback for development without Redis
const memoryStore = new Map<string, any>();

export async function setUserPresence(userId: string, status: string, meetingId?: string | null): Promise<void> {
  const key = `user:presence:${userId}`;
  const payload = JSON.stringify({ status, meetingId: meetingId || null, updatedAt: Date.now() });
  if (isRedisAvailable) {
    try { await redis.setex(key, 60, payload); return; } catch {}
  }
  memoryStore.set(key, payload);
}

export async function getUserPresence(userId: string): Promise<{ status: string; meetingId: string | null } | null> {
  const key = `user:presence:${userId}`;
  if (isRedisAvailable) {
    try {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    } catch {}
  }
  const mem = memoryStore.get(key);
  return mem ? JSON.parse(mem) : null;
}

export async function addRoomParticipant(meetingId: string, participantId: string, info: Record<string, any>): Promise<void> {
  const key = `meeting:room:${meetingId}:participants`;
  if (isRedisAvailable) {
    try {
      await redis.hset(key, participantId, JSON.stringify(info));
      await redis.expire(key, 86400);
      return;
    } catch {}
  }
  let roomMap = memoryStore.get(key);
  if (!roomMap) { roomMap = new Map(); memoryStore.set(key, roomMap); }
  roomMap.set(participantId, JSON.stringify(info));
}

export async function removeRoomParticipant(meetingId: string, participantId: string): Promise<void> {
  const key = `meeting:room:${meetingId}:participants`;
  if (isRedisAvailable) {
    try { await redis.hdel(key, participantId); return; } catch {}
  }
  const roomMap = memoryStore.get(key);
  if (roomMap) roomMap.delete(participantId);
}

export async function getRoomParticipants(meetingId: string): Promise<Record<string, any>[]> {
  const key = `meeting:room:${meetingId}:participants`;
  if (isRedisAvailable) {
    try {
      const raw = await redis.hgetall(key);
      return Object.values(raw).map((val) => JSON.parse(val));
    } catch {}
  }
  const roomMap = memoryStore.get(key);
  if (!roomMap) return [];
  return Array.from(roomMap.values()).map((val: any) => JSON.parse(val));
}

export async function acquireLock(lockKey: string, ttlMs = 10000): Promise<string | null> {
  const identifier = crypto.randomUUID();
  if (isRedisAvailable) {
    try {
      const acquired = await redis.set(`lock:${lockKey}`, identifier, "PX", ttlMs, "NX");
      return acquired === "OK" ? identifier : null;
    } catch {}
  }
  if (!memoryStore.has(`lock:${lockKey}`)) {
    memoryStore.set(`lock:${lockKey}`, identifier);
    setTimeout(() => memoryStore.delete(`lock:${lockKey}`), ttlMs);
    return identifier;
  }
  return null;
}

export async function releaseLock(lockKey: string, identifier: string): Promise<boolean> {
  if (isRedisAvailable) {
    try {
      const script = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
      const result = await redis.eval(script, 1, `lock:${lockKey}`, identifier);
      return result === 1;
    } catch {}
  }
  if (memoryStore.get(`lock:${lockKey}`) === identifier) {
    memoryStore.delete(`lock:${lockKey}`);
    return true;
  }
  return false;
}
