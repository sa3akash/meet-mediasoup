import { spawn, type ChildProcess } from "child_process";
import type { StreamingDestination } from "./streaming-destination-manager";

export interface ActiveStreamSession {
  meetingId: string;
  destination: StreamingDestination;
  process: ChildProcess;
  startedAt: string;
  status: "STARTING" | "STREAMING" | "STOPPED" | "ERROR";
}

export function launchFfmpegStream(
  meetingId: string,
  dest: StreamingDestination,
  onExit: () => void
): { session: ActiveStreamSession; status: "STREAMING" | "ERROR" } {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

  const fullUrl = dest.rtmpUrl.endsWith("/")
    ? `${dest.rtmpUrl}${dest.streamKey}`
    : `${dest.rtmpUrl}/${dest.streamKey}`;

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
      console.warn(`[FFmpegStream] FFmpeg error for ${dest.platform}:`, err.message);
      session.status = "ERROR";
    });

    proc.on("exit", () => {
      session.status = "STOPPED";
      onExit();
    });

    return { session, status: "STREAMING" };
  } catch (err) {
    console.warn("[FFmpegStream] Failed to spawn FFmpeg RTMP process:", err);
    return {
      session: {
        meetingId,
        destination: dest,
        process: null as any,
        startedAt: new Date().toISOString(),
        status: "ERROR",
      },
      status: "ERROR",
    };
  }
}
