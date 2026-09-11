import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const redisSub = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Presence Management (60s TTL, 20s heartbeat)
export async function setUserPresence(userId: string, status: string, meetingId?: string | null): Promise<void> {
  const key = `user:presence:${userId}`;
  const payload = JSON.stringify({
    status,
    meetingId: meetingId || null,
    updatedAt: Date.now(),
  });
  await redis.setex(key, 60, payload);
}

export async function getUserPresence(userId: string): Promise<{ status: string; meetingId: string | null } | null> {
  const data = await redis.get(`user:presence:${userId}`);
  if (!data) return null;
  return JSON.parse(data);
}

// Room State Management
export async function addRoomParticipant(meetingId: string, participantId: string, info: Record<string, any>): Promise<void> {
  const key = `meeting:room:${meetingId}:participants`;
  await redis.hset(key, participantId, JSON.stringify(info));
  await redis.expire(key, 86400); // 24h
}

export async function removeRoomParticipant(meetingId: string, participantId: string): Promise<void> {
  const key = `meeting:room:${meetingId}:participants`;
  await redis.hdel(key, participantId);
}

export async function getRoomParticipants(meetingId: string): Promise<Record<string, any>[]> {
  const key = `meeting:room:${meetingId}:participants`;
  const raw = await redis.hgetall(key);
  return Object.values(raw).map((val) => JSON.parse(val));
}

// Distributed Lock helper for atomic actions (Waiting room, Cloud recording trigger)
export async function acquireLock(lockKey: string, ttlMs = 10000): Promise<string | null> {
  const identifier = crypto.randomUUID();
  const acquired = await redis.set(`lock:${lockKey}`, identifier, "PX", ttlMs, "NX");
  return acquired === "OK" ? identifier : null;
}

export async function releaseLock(lockKey: string, identifier: string): Promise<boolean> {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  const result = await redis.eval(script, 1, `lock:${lockKey}`, identifier);
  return result === 1;
}
