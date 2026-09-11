"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const API_BASE = process.env.API_URL || "http://localhost:4000";

export async function createTemplateAction(prevState: any, formData: FormData) {
  const userId = (formData.get("userId") as string) || "0191eb70-0000-7000-8000-000000000001";
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const settings = {
    waitingRoomEnabled: formData.get("waitingRoomEnabled") === "on",
    autoRecording: formData.get("autoRecording") === "on",
    muteOnJoin: formData.get("muteOnJoin") === "on",
    cameraOffOnJoin: formData.get("cameraOffOnJoin") === "on",
    disableScreenShare: formData.get("disableScreenShare") === "on",
    disableChat: formData.get("disableChat") === "on",
    disableFileShare: formData.get("disableFileShare") === "on",
    disableReactions: formData.get("disableReactions") === "on",
  };

  try {
    const res = await fetch(`${API_BASE}/api/meetings/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, description, settings }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.error || "Failed to create template" };
    }
  } catch {
    return { error: "Network error occurred while creating template" };
  }

  revalidatePath("/meetings");
  return { success: true };
}

export async function instantiateTemplateAction(templateId: string, hostId = "0191eb70-0000-7000-8000-000000000001") {
  let slug = "";
  try {
    const res = await fetch(`${API_BASE}/api/meetings/templates/${templateId}/instantiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId }),
    });
    const data = await res.json();
    slug = data.meeting?.slug || "";
  } catch (err) {
    console.error("Failed to instantiate template:", err);
  }

  if (slug) {
    redirect(`/meeting/${slug}`);
  }
}

export async function resetPersonalRoomAction(userId = "0191eb70-0000-7000-8000-000000000001") {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/pmr/${userId}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    revalidatePath("/meetings");
    return { success: res.ok, slug: data.slug };
  } catch {
    return { error: "Failed to reset personal room code" };
  }
}
