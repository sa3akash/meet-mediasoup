"use server";

import { redirect } from "next/navigation";

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export async function verifyMeetingAccessAction(
  slug: string,
  passcode?: string,
  email?: string,
  userId?: string,
) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/code/${slug}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, email, userId }),
      cache: "no-store",
    });
    return await res.json();
  } catch {
    return {
      allowed: false,
      reason: "NETWORK_ERROR",
      message: "Verification server unavailable",
    };
  }
}

export async function joinMeetingByCodeAction(formData: FormData) {
  const rawCode = formData.get("code") as string;
  if (!rawCode || !rawCode.trim()) return;
  const cleanCode = rawCode.trim().replace(/^https?:\/\/[^\/]+\/meeting\//, "");
  redirect(`/meeting/${cleanCode}`);
}
