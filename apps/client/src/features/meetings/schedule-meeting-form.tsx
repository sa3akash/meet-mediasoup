"use client";

import { useActionState, useState } from "react";
import { Calendar, AlertCircle, Zap, Repeat } from "lucide-react";
import { createMeetingAction } from "../../actions/meeting.actions";
import { MeetingSettingsChecklist } from "./meeting-settings-checklist";
import { MeetingSuccessBanner } from "./components/meeting-success-banner";
import { MeetingSecurityToggles } from "./components/meeting-security-toggles";
import { MeetingScheduleDetails } from "./components/meeting-schedule-details";

export function ScheduleMeetingForm() {
  const [state, formAction, pending] = useActionState(createMeetingAction, null);
  const [meetingType, setMeetingType] = useState<"INSTANT" | "SCHEDULED" | "RECURRING">("SCHEDULED");
  const [accessLevel, setAccessLevel] = useState<"PUBLIC" | "PRIVATE" | "INVITE_ONLY">("PUBLIC");
  const [passcode, setPasscode] = useState("");
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  const generatePasscode = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setPasscode(pin);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {state?.success && <MeetingSuccessBanner state={state} apiUrl={API_URL} />}

      <input type="hidden" name="type" value={meetingType} />
      <input type="hidden" name="accessLevel" value={accessLevel} />
      <input type="hidden" name="timezone" value={timezone} />

      {/* Meeting Category Selector Tabs */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Meeting Format</label>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-neutral-900 border border-white/5">
          <button
            type="button"
            onClick={() => setMeetingType("INSTANT")}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              meetingType === "INSTANT"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant</span>
          </button>
          <button
            type="button"
            onClick={() => setMeetingType("SCHEDULED")}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              meetingType === "SCHEDULED"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled</span>
          </button>
          <button
            type="button"
            onClick={() => setMeetingType("RECURRING")}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              meetingType === "RECURRING"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Recurring</span>
          </button>
        </div>
      </div>

      {/* Topic Title */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Meeting Topic</label>
        <input
          name="title"
          required
          placeholder="e.g. Q4 Executive Product Sync & Demo"
          className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Agenda / Description (Optional)</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Meeting agenda, briefing notes, and links..."
          className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-sm resize-none"
        />
      </div>

      {/* Date & Time if Scheduled or Recurring */}
      <MeetingScheduleDetails
        meetingType={meetingType}
        timezone={timezone}
        setTimezone={setTimezone}
      />

      {/* Security and Access Controls */}
      <MeetingSecurityToggles
        accessLevel={accessLevel}
        setAccessLevel={setAccessLevel}
        passcode={passcode}
        setPasscode={setPasscode}
        generatePasscode={generatePasscode}
      />

      {/* Granular Meeting Settings */}
      <MeetingSettingsChecklist />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
      >
        {meetingType === "INSTANT" ? <Zap className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
        <span>
          {pending
            ? "Creating Meeting..."
            : meetingType === "INSTANT"
            ? "Start Instant Meeting Now"
            : meetingType === "RECURRING"
            ? "Schedule Recurring Meeting"
            : "Schedule Meeting"}
        </span>
      </button>
    </form>
  );
}
