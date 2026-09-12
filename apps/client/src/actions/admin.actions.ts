"use server";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getAdminOverviewAction() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/overview`, { cache: "no-store" });
    if (!res.ok) return { success: false, stats: null };
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error("Failed to fetch admin overview:", err);
    return { success: false, stats: null };
  }
}

export async function getAdminUsersAction(query?: {
  search?: string;
  role?: string;
  isBanned?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (query?.search) params.append("search", query.search);
    if (query?.role) params.append("role", query.role);
    if (query?.isBanned !== undefined) params.append("isBanned", query.isBanned.toString());
    if (query?.limit) params.append("limit", query.limit.toString());
    if (query?.offset) params.append("offset", query.offset.toString());

    const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, { cache: "no-store" });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to fetch admin users:", err);
    return { success: false, users: [], total: 0 };
  }
}

export async function updateUserRoleAction(userId: string, role: string, actorId?: string) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, actorId }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to update user role:", err);
    return { success: false, error: err.message };
  }
}

export async function adminBanUserAction(userId: string, action: "BAN" | "UNBAN", actorId?: string, reason?: string) {
  try {
    const endpoint = action === "BAN" ? "ban" : "unban";
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId, reason }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to ban/unban user in admin:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteUserAction(userId: string, actorId?: string) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId }),
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to delete user:", err);
    return { success: false, error: err.message };
  }
}

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

export async function getAdminAuditLogsAction(limit: number = 50, offset: number = 0) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/audit-logs?limit=${limit}&offset=${offset}`, {
      cache: "no-store",
    });
    return await res.json();
  } catch (err: any) {
    console.error("Failed to fetch audit logs:", err);
    return { success: false, logs: [], count: 0 };
  }
}
