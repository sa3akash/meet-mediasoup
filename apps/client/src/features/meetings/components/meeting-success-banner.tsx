"use client";

import Link from "next/link";
import { CheckCircle2, Calendar, Download, ExternalLink, ArrowRight } from "lucide-react";

interface MeetingSuccessBannerProps {
  state: {
    slug: string;
    meeting?: {
      id?: string;
      title?: string;
    };
  };
  apiUrl: string;
}

export function MeetingSuccessBanner({ state, apiUrl }: MeetingSuccessBannerProps) {
  const meetingId = state.meeting?.id || state.slug;
  const meetingTitle = state.meeting?.title || "Meeting";

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-neutral-900 to-indigo-500/10 border border-emerald-500/30 text-white space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-base">Meeting Scheduled Successfully!</h4>
          <p className="text-xs text-neutral-400">
            Code: <strong className="font-mono text-emerald-300">{state.slug}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
        <a
          href={`${apiUrl}/api/calendar/${meetingId}/google-url`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={async (e) => {
            e.preventDefault();
            try {
              const r = await fetch(`${apiUrl}/api/calendar/${meetingId}/google-url`);
              const d = await r.json();
              if (d.url) window.open(d.url, "_blank");
            } catch {
              window.open(
                `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meetingTitle)}`,
                "_blank"
              );
            }
          }}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-indigo-500/50"
        >
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Google Calendar</span>
          <ExternalLink className="w-3 h-3 text-neutral-500" />
        </a>

        <a
          href={`${apiUrl}/api/calendar/${meetingId}/outlook-url`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={async (e) => {
            e.preventDefault();
            try {
              const r = await fetch(`${apiUrl}/api/calendar/${meetingId}/outlook-url`);
              const d = await r.json();
              if (d.liveUrl) window.open(d.liveUrl, "_blank");
            } catch {
              window.open("https://outlook.live.com/calendar", "_blank");
            }
          }}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-cyan-500/50"
        >
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Outlook Calendar</span>
          <ExternalLink className="w-3 h-3 text-neutral-500" />
        </a>

        <a
          href={`${apiUrl}/api/calendar/${meetingId}/ics`}
          download={`${state.slug}.ics`}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-purple-500/50"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Export .ICS File</span>
        </a>

        <Link
          href={`/meeting/${state.slug}`}
          className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30"
        >
          <span>Join Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
