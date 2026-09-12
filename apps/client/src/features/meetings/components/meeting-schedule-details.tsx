"use client";

import { Globe } from "lucide-react";
import { TIMEZONES } from "../../calendar/calendar-types";

interface MeetingScheduleDetailsProps {
  meetingType: "INSTANT" | "SCHEDULED" | "RECURRING";
  timezone: string;
  setTimezone: (tz: string) => void;
}

export function MeetingScheduleDetails({
  meetingType,
  timezone,
  setTimezone,
}: MeetingScheduleDetailsProps) {
  if (meetingType === "INSTANT") return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Start Time</label>
          <input
            name="scheduledStartAt"
            type="datetime-local"
            required
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">End Time</label>
          <input
            name="scheduledEndAt"
            type="datetime-local"
            required
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Timezone Selector */}
        <div className="sm:col-span-2 flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Timezone</span>
          </label>
          <select
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recurrence Pattern */}
      {meetingType === "RECURRING" && (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
          <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Recurrence Cadence</label>
          <select
            name="recurrenceRule"
            defaultValue="FREQ=WEEKLY"
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none"
          >
            <option value="FREQ=DAILY">Every Day (Daily)</option>
            <option value="FREQ=WEEKLY">Every Week (Weekly)</option>
            <option value="FREQ=MONTHLY">Every Month (Monthly)</option>
          </select>
        </div>
      )}
    </div>
  );
}
