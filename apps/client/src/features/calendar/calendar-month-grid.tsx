"use client";

import { Video, Repeat } from "lucide-react";
import { CalendarEvent } from "./calendar-types";

interface CalendarMonthGridProps {
  calendarDays: Array<{ date: Date; isCurrentMonth: boolean }>;
  eventsByDate: Map<string, CalendarEvent[]>;
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarMonthGrid({
  calendarDays,
  eventsByDate,
  onSelectEvent,
}: CalendarMonthGridProps) {
  const today = new Date();

  return (
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
            d.date.getDate() === today.getDate() &&
            d.date.getMonth() === today.getMonth() &&
            d.date.getFullYear() === today.getFullYear();

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
                      onClick={() => onSelectEvent(evt)}
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
  );
}
