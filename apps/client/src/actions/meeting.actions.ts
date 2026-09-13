"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";


const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return data.user || null;
    }
  } catch {}
  return null;
}

export async function createInstantMeetingAction(
  hostIdOrFormData?: string | FormData,
  _formData?: FormData
) {
  let hostId: string | null =
    typeof hostIdOrFormData === "string" && hostIdOrFormData.length > 10 && hostIdOrFormData !== "0191eb70-0000-7000-8000-000000000001"
      ? hostIdOrFormData
      : null;

  if (!hostId) {
    const user = await getSessionUser();
    hostId = user?.id || null;
  }

  if (!hostId) {
    redirect("/login");
  }

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
  let hostId = (formData.get("hostId") as string) || "";
  if (!hostId || hostId === "0191eb70-0000-7000-8000-000000000001") {
    const user = await getSessionUser();
    hostId = user?.id || "";
  }
  if (!hostId) {
    redirect("/login");
  }
  const title = (formData.get("title") as string) || "Untitled Meeting";
  const description = (formData.get("description") as string) || "";
  const type = (formData.get("type") as string) || "SCHEDULED";
  const accessLevel = (formData.get("accessLevel") as string) || "PUBLIC";
  const passcode = (formData.get("passcode") as string) || undefined;
  const rawInvites = (formData.get("inviteEmails") as string) || "";
  const inviteEmails = rawInvites
    ? rawInvites.split(/[,;\n]/).map((e) => e.trim()).filter((e) => e.length > 0)
    : undefined;

  const scheduledStartAt = formData.get("scheduledStartAt") as string;
  const scheduledEndAt = formData.get("scheduledEndAt") as string;
  const recurrenceRule = formData.get("recurrenceRule") as string;
  const timezone = (formData.get("timezone") as string) || "UTC";

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
    allowGuestUsers: formData.get("allowGuestUsers") !== "off",
  };

  let createdSlug = "";
  let createdMeeting: any = null;
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
        passcode,
        inviteEmails,
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : undefined,
        scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt).toISOString() : undefined,
        recurrenceRule: recurrenceRule || undefined,
        timezone,
        settings,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Failed to create meeting" };
    }
    createdSlug = data.meeting.slug;
    createdMeeting = data.meeting;
  } catch {
    return { error: "Network error occurred while scheduling meeting" };
  }

  revalidatePath("/meetings");
  if (type === "INSTANT") {
    redirect(`/meeting/${createdSlug}`);
  }
  return { success: true, slug: createdSlug, meeting: createdMeeting };
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
