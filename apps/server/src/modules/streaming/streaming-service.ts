import { spawn, type ChildProcess } from "child_process";
import { redis } from "../../infrastructure/redis";

export interface StreamingDestination {
  id: string;
  platform: "YOUTUBE" | "FACEBOOK" | "CUSTOM_RTMP";
  rtmpUrl: string;
  streamKey: string;
}

export interface ActiveStreamSession {
  meetingId: string;
  destination: StreamingDestination;
  process: ChildProcess;
  startedAt: string;
  status: "STARTING" | "STREAMING" | "STOPPED" | "ERROR";
}

// In-Memory store for active streaming child processes
const activeStreams = new Map<string, Map<string, ActiveStreamSession>>(); // meetingId -> destinationId -> Session

export class StreamingService {
  public async startStreaming(
    meetingId: string,
    destinations: StreamingDestination[]
  ): Promise<Array<{ id: string; platform: string; status: string }>> {
    let meetingMap = activeStreams.get(meetingId);
    if (!meetingMap) {
      meetingMap = new Map();
      activeStreams.set(meetingId, meetingMap);
    }

    const results: Array<{ id: string; platform: string; status: string }> = [];
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

    for (const dest of destinations) {
      // Build full RTMP URL
      const fullUrl = dest.rtmpUrl.endsWith("/")
        ? `${dest.rtmpUrl}${dest.streamKey}`
        : `${dest.rtmpUrl}/${dest.streamKey}`;

      // FFmpeg command pushing test / meeting stream to RTMP
      const args = [
        "-f",
        "lavfi",
        "-i",
        "testsrc=size=1280x720:rate=30",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=1000:sample_rate=44100",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-b:v",
        "2500k",
        "-maxrate",
        "3000k",
        "-bufsize",
        "6000k",
        "-pix_fmt",
        "yuv420p",
        "-g",
        "60",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ar",
        "44100",
        "-f",
        "flv",
        fullUrl,
      ];

      try {
        const proc = spawn(ffmpegPath, args, {
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        });

        const session: ActiveStreamSession = {
          meetingId,
          destination: dest,
          process: proc,
          startedAt: new Date().toISOString(),
          status: "STREAMING",
        };

        proc.on("error", (err) => {
          console.warn(`[StreamingService] FFmpeg error for ${dest.platform}:`, err.message);
          session.status = "ERROR";
        });

        proc.on("exit", () => {
          session.status = "STOPPED";
          meetingMap?.delete(dest.id);
        });

        meetingMap.set(dest.id, session);
        results.push({ id: dest.id, platform: dest.platform, status: "STREAMING" });
      } catch (err) {
        console.warn("[StreamingService] Failed to spawn FFmpeg RTMP process:", err);
        results.push({ id: dest.id, platform: dest.platform, status: "ERROR" });
      }
    }

    // Persist to Redis
    try {
      await redis.set(
        `meeting:${meetingId}:live_streaming`,
        JSON.stringify(destinations.map((d) => ({ id: d.id, platform: d.platform, rtmpUrl: d.rtmpUrl }))),
        "EX",
        86400
      );
    } catch {}

    return results;
  }

  public async stopStreaming(
    meetingId: string,
    destinationId?: string
  ): Promise<boolean> {
    const meetingMap = activeStreams.get(meetingId);
    if (!meetingMap) return false;

    if (destinationId) {
      const session = meetingMap.get(destinationId);
      if (session) {
        try {
          session.process.kill("SIGINT");
        } catch {}
        meetingMap.delete(destinationId);
      }
    } else {
      // Stop all destinations for this meeting
      for (const session of meetingMap.values()) {
        try {
          session.process.kill("SIGINT");
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

    return true;
  }

  public getStreamStatus(meetingId: string): {
    isStreaming: boolean;
    destinations: Array<{ id: string; platform: string; startedAt: string; status: string }>;
  } {
    const meetingMap = activeStreams.get(meetingId);
    if (!meetingMap || meetingMap.size === 0) {
      return { isStreaming: false, destinations: [] };
    }

    const destinations: Array<{ id: string; platform: string; startedAt: string; status: string }> = [];
    meetingMap.forEach((session) => {
      destinations.push({
        id: session.destination.id,
        platform: session.destination.platform,
        startedAt: session.startedAt,
        status: session.status,
      });
    });

    return {
      isStreaming: destinations.some((d) => d.status === "STREAMING"),
      destinations,
    };
  }
}

export const streamingService = new StreamingService();
