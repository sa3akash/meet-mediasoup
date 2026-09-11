"use server";

import { revalidatePath } from "next/cache";

const API_BASE = process.env.API_URL || "http://localhost:4000";

export async function updateMeetingSettingsAction(meetingId: string, settings: Record<string, any>) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return { success: res.ok, settings: data.settings };
  } catch {
    return { error: "Failed to update settings" };
  }
}

export async function lockMeetingAction(meetingId: string, locked: boolean) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked }),
    });
    const data = await res.json();
    return { success: res.ok, locked: data.locked };
  } catch {
    return { error: "Failed to lock/unlock meeting" };
  }
}

export async function endMeetingForAllAction(meetingId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return { success: res.ok };
  } catch {
    return { error: "Failed to end meeting" };
  }
}

export async function admitWaitingParticipantAction(meetingId: string, waitingId: string, hostId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/waiting-room/admit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitingId, hostId }),
    });
    return { success: res.ok };
  } catch {
    return { error: "Failed to admit participant" };
  }
}

export async function rejectWaitingParticipantAction(meetingId: string, waitingId: string, hostId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/waiting-room/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitingId, hostId }),
    });
    return { success: res.ok };
  } catch {
    return { error: "Failed to reject participant" };
  }
}
