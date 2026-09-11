"use server";

import { redirect } from "next/navigation";
import { generateMeetingCode } from "@meet/shared-utils";

export async function createInstantMeetingAction() {
  const code = generateMeetingCode();
  redirect(`/meeting/${code}`);
}

export async function joinMeetingByCodeAction(formData: FormData) {
  const rawCode = formData.get("code") as string;
  if (!rawCode || !rawCode.trim()) return;
  const cleanCode = rawCode.trim().replace(/^https?:\/\/[^\/]+\/meeting\//, "");
  redirect(`/meeting/${cleanCode}`);
}
