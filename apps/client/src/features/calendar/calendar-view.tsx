"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Plus,
  Video,
  Repeat,
  Download,
  ExternalLink,
  X,
  Copy,
  Check,
  Shield,
  KeyRound,
  Mail,
  Sparkles,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  meetingId: string;
  title: string;
  description: string | null;
  slug: string;
  startAt: string;
  endAt: string;
  type: string;
  accessLevel: string;
  hasPasscode: boolean;
  recurrenceRule: string | null;
  isRecurringInstance?: boolean;
  timezone: string;
  joinUrl: string;
}

interface CalendarViewProps {
  initialEvents: CalendarEvent[];
  userId?: string;
}

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT / BST)" },
  { value: "Europe/Paris", label: "Paris, Berlin, Amsterdam (CET)" },
  { value: "Asia/Dubai", label: "Dubai, Abu Dhabi (GST)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST / UTC+6)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Singapore", label: "Singapore, Beijing (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo, Seoul (JST)" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne (AEST)" },
];

export function CalendarView({ initialEvents, userId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Compute month grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Preceding padding days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Trailing padding days to fill 42 cells grid (6 rows)
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of initialEvents) {
      try {
        const d = new Date(evt.startAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const list = map.get(key) || [];
        list.push(evt);
        map.set(key, list);
      } catch {}
    }
    return map;
  }, [initialEvents]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {monthName} {year}
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">
              Showing scheduled meetings & recurring cadence in your selected timezone
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timezone Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-950 border border-white/10 text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-neutral-900 text-white">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-950 border border-white/10">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/meetings/new"
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </Link>
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="rounded-3xl border border-white/5 bg-neutral-900/50 backdrop-blur-md overflow-hidden shadow-2xl">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-neutral-900 text-neutral-400 text-xs font-semibold py-3 text-center uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* 42-day Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-white/5">
          {calendarDays.map((d, index) => {
            const dateKey = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, "0")}-${String(d.date.getDate()).padStart(2, "0")}`;
            const events = eventsByDate.get(dateKey) || [];
            const isToday =
              d.date.getDate() === new Date().getDate() &&
              d.date.getMonth() === new Date().getMonth() &&
              d.date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 flex flex-col gap-1.5 transition-colors ${
                  d.isCurrentMonth ? "bg-neutral-950/40 hover:bg-white/[0.02]" : "bg-neutral-950/80 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isToday
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40"
                        : d.isCurrentMonth
                        ? "text-neutral-300"
                        : "text-neutral-600"
                    }`}
                  >
                    {d.date.getDate()}
                  </span>
                  {events.length > 0 && (
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {events.length} {events.length === 1 ? "event" : "events"}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] scrollbar-none">
                  {events.map((evt) => {
                    const timeStr = new Date(evt.startAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isRecurring = evt.type === "RECURRING" || evt.isRecurringInstance;

                    return (
                      <button
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`w-full text-left p-1.5 rounded-xl text-xs transition-all flex items-center justify-between gap-1 group truncate ${
                          isRecurring
                            ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/20"
                            : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 border border-indigo-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isRecurring ? (
                            <Repeat className="w-3 h-3 text-purple-400 shrink-0" />
                          ) : (
                            <Video className="w-3 h-3 text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate font-medium text-[11px]">{evt.title}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0">{timeStr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 text-neutral-400 text-xs mt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-indigo-300">
                      {selectedEvent.type}
                    </span>
                    {selectedEvent.recurrenceRule && (
                      <span className="flex items-center gap-1 text-purple-400 text-[11px]">
                        <Repeat className="w-3 h-3" />
                        <span>{selectedEvent.recurrenceRule.replace("FREQ=", "")}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedEvent.description && (
              <p className="text-neutral-300 text-xs bg-neutral-950/60 p-3 rounded-2xl border border-white/5">
                {selectedEvent.description}
              </p>
            )}

            {/* Time & Timezone Box */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-neutral-300 text-xs">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {new Date(selectedEvent.startAt).toLocaleString([], {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400 text-xs">
                <Globe className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>Timezone: {selectedEvent.timezone || selectedTimezone}</span>
              </div>
            </div>

            {/* Join Link Copy */}
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-neutral-950 border border-white/10">
              <input
                readOnly
                value={selectedEvent.joinUrl}
                className="bg-transparent text-white text-xs font-mono px-2 flex-1 focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(selectedEvent.joinUrl)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Sync & Export Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <a
                href={`${API_URL}/api/calendar/${selectedEvent.meetingId}/google-url`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch(`${API_URL}/api/calendar/${selectedEvent.meetingId}/google-url`);
                    const d = await res.json();
                    if (d.url) window.open(d.url, "_blank");
                  } catch {
                    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent.title)}`, "_blank");
                  }
                }}
                className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex flex-col items-center justify-center gap-1 text-center transition-all hover:border-indigo-500/50"
              >
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>Google Sync</span>
              </a>

              <a
                href={`${API_URL}/api/calendar/${selectedEvent.meetingId}/outlook-url`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch(`${API_URL}/api/calendar/${selectedEvent.meetingId}/outlook-url`);
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
                href={`${API_URL}/api/calendar/${selectedEvent.meetingId}/ics`}
                download={`${selectedEvent.slug}.ics`}
                className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 flex flex-col items-center justify-center gap-1 text-center transition-all hover:border-purple-500/50"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Export .ICS</span>
              </a>
            </div>

            {/* Enter Meeting Button */}
            <Link
              href={`/meeting/${selectedEvent.slug}`}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Video className="w-4 h-4" />
              <span>Enter Meeting Room</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
