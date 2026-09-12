"use client";

import { Calendar as CalendarIcon, Download } from "lucide-react";
import { CalendarEvent } from "./calendar-types";

interface EventSyncActionsProps {
  event: CalendarEvent;
  apiUrl: string;
}

export function EventSyncActions({ event, apiUrl }: EventSyncActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 pt-1">
      <a
        href={`${apiUrl}/api/calendar/${event.meetingId}/google-url`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (e) => {
          e.preventDefault();
          try {
            const res = await fetch(`${apiUrl}/api/calendar/${event.meetingId}/google-url`);
            const d = await res.json();
            if (d.url) window.open(d.url, "_blank");
          } catch {
            window.open(
              `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}`,
              "_blank"
            );
          }
        }}
        className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex flex-col items-center justify-center gap-1 text-center transition-all hover:border-indigo-500/50"
      >
        <CalendarIcon className="w-4 h-4 text-blue-400" />
        <span>Google Sync</span>
      </a>

      <a
        href={`${apiUrl}/api/calendar/${event.meetingId}/outlook-url`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (e) => {
          e.preventDefault();
          try {
            const res = await fetch(`${apiUrl}/api/calendar/${event.meetingId}/outlook-url`);
            const d = await res.json();
            if (d.liveUrl) window.open(d.liveUrl, "_blank");
          } catch {
            window.open("https://outlook.live.com/calendar", "_blank");
          }
        }}
        className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex flex-col items-center justify-center gap-1 text-center transition-all hover:border-cyan-500/50"
      >
        <CalendarIcon className="w-4 h-4 text-cyan-400" />
        <span>Outlook Sync</span>
      </a>

      <a
        href={`${apiUrl}/api/calendar/${event.meetingId}/ics`}
        download={`${event.slug}.ics`}
        className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex flex-col items-center justify-center gap-1 text-center transition-all hover:border-purple-500/50"
      >
        <Download className="w-4 h-4 text-purple-400" />
        <span>Export .ICS</span>
      </a>
    </div>
  );
}
