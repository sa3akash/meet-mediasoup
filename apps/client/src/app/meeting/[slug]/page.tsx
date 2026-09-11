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

export default async function MeetingRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MeetingRoomClient slug={slug} />;
}
