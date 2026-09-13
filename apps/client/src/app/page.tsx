import type { Metadata } from "next";
import { HomeHeader } from "../components/landing/home-header";
import { HomeHero } from "../components/landing/home-hero";
import { getSessionUser } from "../lib/session";

export const metadata: Metadata = {
  title: "Meet - Enterprise Video Conferencing",
  description: "Secure, real-time video meetings powered by Mediasoup WebRTC and Next.js Server Components.",
  openGraph: {
    title: "Meet - Premium Video Meetings for Everyone",
    description: "Ultra-low latency SFU architecture with dynamic simulcast and active speaker detection.",
    type: "website",
  },
};

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <HomeHeader user={user} />
      <HomeHero />
      <footer className="w-full px-8 py-4 border-t border-white/5 text-center text-xs text-neutral-500">
        Enterprise Google Meet Platform • Next.js App Router (SSR) + Elysia + Mediasoup
      </footer>
    </div>
  );
}
