"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Keyboard, Plus, Shield, Zap, Globe, Sparkles } from "lucide-react";
import { generateMeetingCode } from "@meet/shared-utils";

export default function HomePage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");

  const handleStartInstantMeeting = () => {
    const slug = generateMeetingCode();
    router.push(`/meeting/${slug}`);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    const cleanCode = meetingCode.trim().replace(/^https?:\/\/[^\/]+\/meeting\//, "");
    router.push(`/meeting/${cleanCode}`);
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="w-full px-8 py-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-neutral-950/70 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
            Meet
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-white/60 hidden sm:inline">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-semibold">
            AG
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left Side: Actions */}
        <div className="flex-1 max-w-xl flex flex-col gap-6">
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
            <button
              onClick={handleStartInstantMeeting}
              className="px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" /> New meeting
            </button>

            <form onSubmit={handleJoinWithCode} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Keyboard className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter a code or link"
                  className="w-full bg-neutral-900 border border-white/10 rounded-full pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                type="submit"
                disabled={!meetingCode.trim()}
                className="px-6 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 font-semibold text-sm border border-white/10 transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5">
            <div className="flex flex-col gap-1">
              <Shield className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-xs font-semibold text-white">Enterprise Grade</span>
              <span className="text-[11px] text-neutral-400">Encrypted SFU pipes</span>
            </div>
            <div className="flex flex-col gap-1">
              <Zap className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-xs font-semibold text-white">Simulcast & SVC</span>
              <span className="text-[11px] text-neutral-400">Dynamic layer scaling</span>
            </div>
            <div className="flex flex-col gap-1">
              <Globe className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-xs font-semibold text-white">100k+ Scale</span>
              <span className="text-[11px] text-neutral-400">Multi-worker cluster</span>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Card */}
        <div className="flex-1 w-full max-w-md">
          <div className="relative w-full aspect-square rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

            <div className="grid grid-cols-2 gap-3 z-10">
              <div className="aspect-video rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-xs text-white/60 font-medium">
                Participant A
              </div>
              <div className="aspect-video rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-xs text-white/60 font-medium">
                Participant B
              </div>
              <div className="aspect-video rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-xs text-white/60 font-medium">
                Participant C
              </div>
              <div className="aspect-video rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-xs text-indigo-300 font-semibold ring-2 ring-indigo-500/30">
                Active Speaker
              </div>
            </div>

            <div className="z-10 mt-6 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white">Your meeting is ready</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Share this meeting code with anyone you want to confer with securely.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-8 py-4 border-t border-white/5 text-center text-xs text-neutral-500">
        Enterprise Google Meet Platform • Bun + Next.js App Router + Mediasoup SFU
      </footer>
    </div>
  );
}
