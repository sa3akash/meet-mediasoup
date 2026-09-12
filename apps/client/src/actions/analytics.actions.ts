"use server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getAnalyticsOverviewAction(hostId?: string) {
  try {
    const url = hostId ? `${API_BASE}/api/analytics/overview?hostId=${hostId}` : `${API_BASE}/api/analytics/overview`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { success: false, overview: null };
    const data = await res.json();
    return { success: true, overview: data.overview };
  } catch (e: any) {
    console.error("Failed to fetch analytics overview:", e);
    return { success: false, overview: null };
  }
}

export async function getMeetingAnalyticsSummaryAction(meetingId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/meetings/${meetingId}`, { cache: "no-store" });
    if (!res.ok) return { success: false, summary: null };
    const data = await res.json();
    return { success: true, summary: data.summary };
  } catch (e: any) {
    console.error("Failed to fetch meeting summary:", e);
    return { success: false, summary: null };
  }
}

export async function getRecordingStatisticsAction(hostId?: string) {
  try {
    const url = hostId ? `${API_BASE}/api/analytics/recordings?hostId=${hostId}` : `${API_BASE}/api/analytics/recordings`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { success: false, statistics: null };
    const data = await res.json();
    return { success: true, statistics: data.statistics };
  } catch (e: any) {
    console.error("Failed to fetch recording statistics:", e);
    return { success: false, statistics: null };
  }
}

export async function sendTelemetryReportAction(payload: any) {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
