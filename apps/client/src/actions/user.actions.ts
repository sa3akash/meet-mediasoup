"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const API_BASE = process.env.API_URL || "http://localhost:4000";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function updateProfileAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string;
  const timezone = formData.get("timezone") as string;
  const language = formData.get("language") as string;

  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/users/me`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name, bio, timezone, language }),
    });

    const data = await res.json();
    if (!res.ok) return { error: data.error || "Update failed" };

    revalidatePath("/settings/profile");
    return { success: true, message: "Profile updated successfully" };
  } catch {
    return { error: "Failed to update profile" };
  }
}

export async function updatePreferencesAction(preferences: {
  emailReminders: boolean;
  emailInvites: boolean;
  pushNewMessages: boolean;
  inAppSounds: boolean;
}) {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/users/me/notifications/preferences`, {
      method: "PUT",
      headers,
      body: JSON.stringify(preferences),
    });

    if (!res.ok) return { error: "Failed to update notification settings" };

    revalidatePath("/settings/notifications");
    return { success: true };
  } catch {
    return { error: "Network error" };
  }
}

export async function updatePresenceAction(status: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE") {
  try {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_BASE}/api/users/me/presence`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    if (!res.ok) return { error: "Failed to update presence" };
    return { success: true, status };
  } catch {
    return { error: "Network error" };
  }
}
