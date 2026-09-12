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

const API_BASE = process.env.API_URL || "http://localhost:4000";

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
  const meeting = await getMeetingDetails(slug);
  return <MeetingRoomClient slug={slug} initialMeeting={meeting} />;
}
