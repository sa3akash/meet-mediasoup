export interface TelemetryPayload {
  meetingId: string;
  userId?: string;
  device?: {
    deviceType?: "desktop" | "mobile" | "tablet" | string;
    browser?: string;
    os?: string;
  };
  quality?: {
    audioBitrate?: number;
    videoBitrate?: number;
    packetLoss?: number;
    fps?: number;
    jitter?: number;
    resolution?: string;
  };
  network?: {
    rtt?: number;
    bandwidth?: number;
    transportLoss?: number;
  };
  durationSeconds?: number;
  participantCount?: number;
  timestamp?: string;
}
