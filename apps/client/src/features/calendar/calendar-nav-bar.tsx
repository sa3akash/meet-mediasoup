"use client";

import Link from "next/link";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Globe, Plus } from "lucide-react";
import { TIMEZONES } from "./calendar-types";

interface CalendarNavBarProps {
  monthName: string;
  year: number;
  selectedTimezone: string;
  onTimezoneChange: (tz: string) => void;
  onPrevMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
}

export function CalendarNavBar({
  monthName,
  year,
  selectedTimezone,
  onTimezoneChange,
  onPrevMonth,
  onToday,
  onNextMonth,
}: CalendarNavBarProps) {
  return (
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
            onChange={(e) => onTimezoneChange(e.target.value)}
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
            onClick={onPrevMonth}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onToday}
            className="px-3 py-1 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Today
          </button>
          <button
            onClick={onNextMonth}
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
  );
}
