"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const API_BASE = process.env.API_URL || "http://localhost:4000";

export async function createInstantMeetingAction(hostId = "0191eb70-0000-7000-8000-000000000001") {
  let slug = "";
  try {
    const res = await fetch(`${API_BASE}/api/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId,
        title: "Instant Meeting",
        type: "INSTANT",
        accessLevel: "PUBLIC",
      }),
    });
    const data = await res.json();
    slug = data.meeting?.slug || "";
  } catch (err) {
    console.error("Failed to create instant meeting:", err);
  }

  if (slug) {
    redirect(`/meeting/${slug}`);
  }
}

export async function createMeetingAction(prevState: any, formData: FormData) {
  const hostId = (formData.get("hostId") as string) || "0191eb70-0000-7000-8000-000000000001";
  const title = (formData.get("title") as string) || "Untitled Meeting";
  const description = (formData.get("description") as string) || "";
  const type = (formData.get("type") as string) || "SCHEDULED";
  const accessLevel = (formData.get("accessLevel") as string) || "PUBLIC";
  const scheduledStartAt = formData.get("scheduledStartAt") as string;
  const scheduledEndAt = formData.get("scheduledEndAt") as string;
  const recurrenceRule = formData.get("recurrenceRule") as string;

  const settings = {
    waitingRoomEnabled: formData.get("waitingRoomEnabled") === "on",
    autoRecording: formData.get("autoRecording") === "on",
    muteOnJoin: formData.get("muteOnJoin") === "on",
    cameraOffOnJoin: formData.get("cameraOffOnJoin") === "on",
    disableScreenShare: formData.get("disableScreenShare") === "on",
    disableChat: formData.get("disableChat") === "on",
    disableFileShare: formData.get("disableFileShare") === "on",
    disableReactions: formData.get("disableReactions") === "on",
    lockMeeting: formData.get("lockMeeting") === "on",
  };

  let createdSlug = "";
  try {
    const res = await fetch(`${API_BASE}/api/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId,
        title,
        description,
        type,
        accessLevel,
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : undefined,
        scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : undefined,
        recurrenceRule: recurrenceRule || undefined,
        settings,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Failed to create meeting" };
    }
    createdSlug = data.meeting.slug;
  } catch {
    return { error: "Network error occurred while scheduling meeting" };
  }

  revalidatePath("/meetings");
  if (type === "INSTANT") {
    redirect(`/meeting/${createdSlug}`);
  }
  return { success: true, slug: createdSlug };
}

export async function joinMeetingByCodeAction(formData: FormData) {
  const rawCode = formData.get("code") as string;
  if (!rawCode || !rawCode.trim()) return;
  const cleanCode = rawCode.trim().replace(/^https?:\/\/[^\/]+\/meeting\//, "");
  redirect(`/meeting/${cleanCode}`);
}

export async function cancelMeetingAction(meetingId: string) {
  try {
    await fetch(`${API_BASE}/api/meetings/${meetingId}`, { method: "DELETE" });
    revalidatePath("/meetings");
    return { success: true };
  } catch {
    return { error: "Failed to cancel meeting" };
  }
}
