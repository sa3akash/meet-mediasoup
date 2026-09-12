"use server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getCalendarEventsAction(options: {
  userId?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
} = {}) {
  try {
    const params = new URLSearchParams();
    if (options.userId) params.set("userId", options.userId);
    if (options.startDate) params.set("startDate", options.startDate);
    if (options.endDate) params.set("endDate", options.endDate);
    if (options.timezone) params.set("timezone", options.timezone);

    const res = await fetch(`${API_BASE}/api/calendar/meetings?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return { success: false, events: [] };
    const data = await res.json();
    return { success: true, events: data.events || [] };
  } catch (e: any) {
    console.error("Failed to fetch calendar events:", e);
    return { success: false, events: [] };
  }
}

export async function getGoogleCalendarUrlAction(meetingId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/calendar/${meetingId}/google-url`, {
      cache: "no-store",
    });
    if (!res.ok) return { success: false, url: null };
    const data = await res.json();
    return { success: true, url: data.url };
  } catch {
    return { success: false, url: null };
  }
}

export async function getOutlookCalendarUrlAction(meetingId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/calendar/${meetingId}/outlook-url`, {
      cache: "no-store",
    });
    if (!res.ok) return { success: false, liveUrl: null, office365Url: null };
    const data = await res.json();
    return { success: true, liveUrl: data.liveUrl, office365Url: data.office365Url };
  } catch {
    return { success: false, liveUrl: null, office365Url: null };
  }
}

export async function getIcsDownloadUrl(meetingId: string) {
  return `${API_BASE}/api/calendar/${meetingId}/ics`;
}
