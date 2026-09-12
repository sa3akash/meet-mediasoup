import type { Metadata } from "next";
import { MeetingRoomClient } from "../../../features/meeting/meeting-room-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Join Meeting ${slug} - Meet`,
    description: `You have been invited to join an ultra-low latency video meeting on Meet (${slug}).`,
    openGraph: {
      title: `Join Meeting: ${slug}`,
      description: "Fast, encrypted WebRTC meeting room.",
      type: "video.other",
    },
    robots: {
      index: false, // Private meeting rooms should not be indexed by search engines
      follow: false,
    },
  };
}

import { cookies } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:4000";

async function getCurrentUser() {
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

async function getMeetingDetails(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/meetings/code/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.meeting;
  } catch {
    return null;
  }
}

export default async function MeetingRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [meeting, user] = await Promise.all([
    getMeetingDetails(slug),
    getCurrentUser(),
  ]);
  return <MeetingRoomClient slug={slug} initialMeeting={meeting} currentUser={user} />;
}
