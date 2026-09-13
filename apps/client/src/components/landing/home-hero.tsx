import { Sparkles, Plus, Keyboard, Shield, Zap, Globe } from "lucide-react";
import { createInstantMeetingAction } from "../../actions/meeting.actions";
import { joinMeetingByCodeAction } from "../../actions/meeting-access.actions";

export function HomeHero() {
  return (
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
  );
}
