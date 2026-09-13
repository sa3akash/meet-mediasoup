"use server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getAdminMeetingsAction(status?: string, limit: number = 50, offset: number = 0) {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    const res = await fetch(`${API_BASE}/api/admin/meetings?${params.toString()}`, { cache: "no-store" });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to fetch admin meetings:", err);
    return { success: false, meetings: [], total: 0 };
  }
}

export async function terminateMeetingAction(meetingId: string, actorId?: string, reason?: string) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/meetings/${meetingId}/terminate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId, reason }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to terminate meeting:", err);
    return { success: false, error: err.message };
  }
}

export async function getAdminRecordingsAction(limit: number = 50, offset: number = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/recordings?limit=${limit}&offset=${offset}`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to fetch admin recordings:", err);
    return { success: false, recordings: [], total: 0 };
  }
}

export async function deleteAdminRecordingAction(recordingId: string, actorId?: string) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/recordings/${recordingId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to delete recording:", err);
    return { success: false, error: err.message };
  }
}

export async function getAdminStorageAction() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/storage`, { cache: "no-store" });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to fetch admin storage:", err);
    return { success: false, storage: null };
  }
}
