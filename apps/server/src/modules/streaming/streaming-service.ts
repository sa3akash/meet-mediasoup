import { redis } from "../../infrastructure/redis";
import { db } from "../../infrastructure/database";
import { meetingStreams } from "../../infrastructure/database/schema/recordings";
import { eq } from "drizzle-orm";
import {
  destinationManager,
  type StreamingDestination,
} from "./services/streaming-destination-manager";
import {
  launchFfmpegStream,
  type ActiveStreamSession,
} from "./services/ffmpeg-stream-launcher";

export type { StreamingDestination, ActiveStreamSession };

// In-Memory store for active streaming child processes: meetingId -> destinationId -> Session
const activeStreams = new Map<string, Map<string, ActiveStreamSession>>();

export class StreamingService {
  public getDestinations(meetingId: string) {
    return destinationManager.getDestinations(meetingId);
  }

  public addDestination(meetingId: string, dest: Omit<StreamingDestination, "id">) {
    return destinationManager.addDestination(meetingId, dest);
  }

  public removeDestination(meetingId: string, destinationId: string) {
    return destinationManager.removeDestination(meetingId, destinationId);
  }

  public async startStreaming(
    meetingId: string,
    destinationsInput?: string[] | StreamingDestination[]
  ): Promise<{ startedCount: number; results: Array<{ id: string; platform: string; status: string }> }> {
    let meetingMap = activeStreams.get(meetingId);
    if (!meetingMap) {
      meetingMap = new Map();
      activeStreams.set(meetingId, meetingMap);
    }

    let destinations: StreamingDestination[] = [];
    if (Array.isArray(destinationsInput) && destinationsInput.length > 0) {
      if (typeof destinationsInput[0] === "string") {
        const saved = destinationManager.getDestinations(meetingId);
        destinations = (destinationsInput as string[])
          .map((id) => saved.find((d) => d.id === id))
          .filter(Boolean) as StreamingDestination[];
      } else {
        destinations = destinationsInput as StreamingDestination[];
      }
    } else {
      destinations = destinationManager.getDestinations(meetingId);
    }

    const results: Array<{ id: string; platform: string; status: string }> = [];

    for (const dest of destinations) {
      const { session, status } = launchFfmpegStream(meetingId, dest, () => {
        meetingMap?.delete(dest.id);
      });

      if (status === "STREAMING") {
        meetingMap.set(dest.id, session);
      }
      results.push({ id: dest.id, platform: dest.platform, status });

      // Persist in DB
      try {
        const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (isValidUuid.test(meetingId)) {
          await db.insert(meetingStreams).values({
            id: isValidUuid.test(dest.id) ? dest.id : crypto.randomUUID(),
            meetingId,
            platform: dest.platform,
            rtmpUrl: dest.rtmpUrl,
            streamKey: dest.streamKey || "key",
            status: "STREAMING",
          });
        }
      } catch (dbErr) {
        console.warn("[StreamingService] DB stream log notice:", (dbErr as any).message || dbErr);
      }
    }

    try {
      await redis.set(
        `meeting:${meetingId}:live_streaming`,
        JSON.stringify(destinations.map((d) => ({ id: d.id, platform: d.platform, rtmpUrl: d.rtmpUrl }))),
        "EX",
        86400
      );
    } catch {}

    return {
      startedCount: results.filter((r) => r.status === "STREAMING").length,
      results,
    };
  }

  public async stopStreaming(
    meetingId: string,
    destinationId?: string
  ): Promise<{ stopped: boolean; remainingStreams: number }> {
    const meetingMap = activeStreams.get(meetingId);
    if (!meetingMap) return { stopped: false, remainingStreams: 0 };

    if (destinationId) {
      const session = meetingMap.get(destinationId);
      if (session?.process) {
        try {
          session.process.kill("SIGINT");
        } catch {}
        meetingMap.delete(destinationId);
      }
    } else {
      for (const session of meetingMap.values()) {
        try {
          session.process?.kill("SIGINT");
        } catch {}
      }
      meetingMap.clear();
      activeStreams.delete(meetingId);
    }

    try {
      if (meetingMap.size === 0) {
        await redis.del(`meeting:${meetingId}:live_streaming`);
      }
    } catch {}

    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(meetingId)) {
        await db
          .update(meetingStreams)
          .set({ status: "STOPPED", updatedAt: new Date() })
          .where(eq(meetingStreams.meetingId, meetingId));
      }
    } catch {}

    return { stopped: true, remainingStreams: meetingMap?.size || 0 };
  }

  public getStreamStatus(meetingId: string) {
    const meetingMap = activeStreams.get(meetingId);
    if (!meetingMap || meetingMap.size === 0) {
      return { isStreaming: false, destinations: [] };
    }

    const destinations = Array.from(meetingMap.values()).map((s) => ({
      id: s.destination.id,
      platform: s.destination.platform,
      startedAt: s.startedAt,
      status: s.status,
    }));

    return {
      isStreaming: destinations.some((d) => d.status === "STREAMING"),
      destinations,
    };
  }

  public async getMeetingStreamHistory(meetingId: string): Promise<any[]> {
    try {
      const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (isValidUuid.test(meetingId)) {
        return await db
          .select()
          .from(meetingStreams)
          .where(eq(meetingStreams.meetingId, meetingId));
      }
    } catch {}
    return [];
  }
}

export const streamingService = new StreamingService();
