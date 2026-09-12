import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Video, Keyboard, Plus, Shield, Zap, Globe, Sparkles, LayoutDashboard, LogOut } from "lucide-react";
import { createInstantMeetingAction, joinMeetingByCodeAction } from "../actions/meeting.actions";
import { logoutAction } from "../actions/auth.actions";

export const metadata: Metadata = {
  title: "Meet - Enterprise Video Conferencing",
  description: "Secure, real-time video meetings powered by Mediasoup WebRTC and Next.js Server Components.",
  openGraph: {
    title: "Meet - Premium Video Meetings for Everyone",
    description: "Ultra-low latency SFU architecture with dynamic simulcast and active speaker detection.",
    type: "website",
  },
};

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="w-full px-6 sm:px-8 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-neutral-950/70 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
            Meet
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/meetings"
              className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.slice(0, 2)
                )}
              </div>
              <div className="hidden md:flex flex-col text-left pr-1">
                <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                <span className="text-[10px] text-neutral-400 leading-tight">{user.email}</span>
              </div>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-2 rounded-full bg-neutral-900 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-neutral-400 text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white text-xs transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/30"
            >
              Get Started
            </Link>
          </nav>
        )}
      </header>

      {/* Main SSR Hero */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col md:flex-row items-center justify-between gap-12">
        <article className="flex-1 max-w-xl flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Video Conferencing
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Premium video meetings for everyone, anywhere.
          </h1>

          <p className="text-neutral-400 text-lg leading-relaxed">
            Ultra-low latency SFU architecture powered by Mediasoup WebRTC, dynamic simulcast, active speaker auto-focus, and real-time collaboration.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <form action={createInstantMeetingAction}>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" /> New meeting
              </button>
            </form>

            <form action={joinMeetingByCodeAction} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Keyboard className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  name="code"
                  type="text"
                  required
                  placeholder="Enter a code or link"
                  className="w-full bg-neutral-900 border border-white/10 rounded-full pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 font-semibold text-sm border border-white/10 transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5">
            <div>
              <Shield className="w-5 h-5 text-indigo-400 mb-1" />
              <div className="text-xs font-semibold text-white">Enterprise Grade</div>
              <div className="text-[11px] text-neutral-400">Encrypted SFU pipes</div>
            </div>
            <div>
              <Zap className="w-5 h-5 text-indigo-400 mb-1" />
              <div className="text-xs font-semibold text-white">Simulcast & SVC</div>
              <div className="text-[11px] text-neutral-400">Dynamic layer scaling</div>
            </div>
            <div>
              <Globe className="w-5 h-5 text-indigo-400 mb-1" />
              <div className="text-xs font-semibold text-white">100k+ Scale</div>
              <div className="text-[11px] text-neutral-400">Multi-worker cluster</div>
            </div>
          </div>
        </article>
      </main>

      <footer className="w-full px-8 py-4 border-t border-white/5 text-center text-xs text-neutral-500">
        Enterprise Google Meet Platform • Next.js App Router (SSR) + Elysia + Mediasoup
      </footer>
    </div>
  );
}
