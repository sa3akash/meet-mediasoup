import { db } from "../../../infrastructure/database";
import { meetingRecordings } from "../../../infrastructure/database/schema";
import { desc } from "drizzle-orm";

export async function computeRecordingStatistics(hostId?: string) {
  const allRecordings = await db.query.meetingRecordings.findMany({
    orderBy: [desc(meetingRecordings.createdAt)],
  });

  let totalSizeBytes = 0;
  let totalDurationSeconds = 0;
  const statusCounts: Record<string, number> = {
    READY: 0,
    RECORDING: 0,
    PROCESSING: 0,
    FAILED: 0,
    INITIALIZING: 0,
  };
  const formatCounts: Record<string, number> = {
    MP4: 0,
    HLS: 0,
  };

  for (const rec of allRecordings) {
    if (rec.fileSizeBytes) totalSizeBytes += Number(rec.fileSizeBytes);
    if (rec.durationSeconds) totalDurationSeconds += Number(rec.durationSeconds);
    statusCounts[rec.status] = (statusCounts[rec.status] || 0) + 1;
    formatCounts[rec.format] = (formatCounts[rec.format] || 0) + 1;
  }

  const totalStorageMb = Number((totalSizeBytes / (1024 * 1024)).toFixed(2));
  const totalStorageGb = Number((totalSizeBytes / (1024 * 1024 * 1024)).toFixed(3));
  const totalDurationHours = Number((totalDurationSeconds / 3600).toFixed(2));

  return {
    totalRecordings: allRecordings.length,
    totalStorageBytes: totalSizeBytes,
    totalStorageMb,
    totalStorageGb,
    totalDurationSeconds,
    totalDurationHours,
    statusBreakdown: statusCounts,
    formatBreakdown: formatCounts,
    recentRecordings: allRecordings.slice(0, 10),
  };
}
