"use server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function submitReportAction(data: {
  reporterId: string;
  reportedUserId?: string;
  reportedMeetingId?: string;
  category: "SPAM" | "HARASSMENT" | "INAPPROPRIATE_CONTENT" | "OTHER";
  reason: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/api/moderation/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("Failed to submit report:", err);
    return { success: false, error: err.message };
  }
}

export async function getReportsAction(query?: { status?: string; category?: string; limit?: number; offset?: number }) {
  try {
    const params = new URLSearchParams();
    if (query?.status) params.append("status", query.status);
    if (query?.category) params.append("category", query.category);
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.offset) params.append("offset", query.offset.toString());

    const res = await fetch(`${API_BASE}/api/moderation/reports?${params.toString()}`, {
      cache: "no-store",
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("Failed to get reports:", err);
    return { success: false, reports: [], count: 0 };
  }
}

export async function updateReportStatusAction(
  reportId: string,
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED",
  moderatorId?: string
) {
  try {
    const res = await fetch(`${API_BASE}/api/moderation/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, moderatorId }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("Failed to update report:", err);
    return { success: false, error: err.message };
  }
}

export async function kickParticipantAction(
  meetingId: string,
  participantId: string,
  moderatorId?: string,
  reason?: string
) {
  try {
    const res = await fetch(`${API_BASE}/api/moderation/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, participantId, moderatorId, reason }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to kick participant:", err);
    return { success: false, error: err.message };
  }
}

export async function banUserAction(userId: string, action: "BAN" | "UNBAN", moderatorId?: string, reason?: string) {
  try {
    const res = await fetch(`${API_BASE}/api/moderation/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, moderatorId, reason }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to ban/unban user:", err);
    return { success: false, error: err.message };
  }
}

export async function getAbuseStatsAction() {
  try {
    const res = await fetch(`${API_BASE}/api/moderation/abuse-stats`, { cache: "no-store" });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to get abuse stats:", err);
    return { success: false, stats: null };
  }
}
