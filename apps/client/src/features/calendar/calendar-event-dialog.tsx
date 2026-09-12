"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Video,
  Repeat,
  X,
  Copy,
  Check,
} from "lucide-react";
import { CalendarEvent } from "./calendar-types";
import { EventSyncActions } from "./components/event-sync-actions";

interface CalendarEventDialogProps {
  event: CalendarEvent;
  selectedTimezone: string;
  onClose: () => void;
}

export function CalendarEventDialog({
  event,
  selectedTimezone,
  onClose,
}: CalendarEventDialogProps) {
  const [copied, setCopied] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{event.title}</h3>
              <div className="flex items-center gap-2 text-neutral-400 text-xs mt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-indigo-300">
                  {event.type}
                </span>
                {event.recurrenceRule && (
                  <span className="flex items-center gap-1 text-purple-400 text-[11px]">
                    <Repeat className="w-3 h-3" />
                    <span>{event.recurrenceRule.replace("FREQ=", "")}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {event.description && (
          <p className="text-neutral-300 text-xs bg-neutral-950/60 p-3 rounded-2xl border border-white/5">
            {event.description}
          </p>
        )}

        {/* Time & Timezone Box */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-neutral-300 text-xs">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {new Date(event.startAt).toLocaleString([], {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <Globe className="w-4 h-4 text-neutral-500 shrink-0" />
            <span>Timezone: {event.timezone || selectedTimezone}</span>
          </div>
        </div>

        {/* Join Link Copy */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-neutral-950 border border-white/10">
          <input
            readOnly
            value={event.joinUrl}
            className="bg-transparent text-white text-xs font-mono px-2 flex-1 focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={() => handleCopyLink(event.joinUrl)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Sync & Export Buttons */}
        <EventSyncActions event={event} apiUrl={API_URL} />

        {/* Enter Meeting Button */}
        <Link
          href={`/meeting/${event.slug}`}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
        >
          <Video className="w-4 h-4" />
          <span>Enter Meeting Room</span>
        </Link>
      </div>
    </div>
  );
}
