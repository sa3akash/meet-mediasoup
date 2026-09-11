"use client";

import { useActionState, useState } from "react";
import { Calendar, Clock, Globe, Shield, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { createMeetingAction } from "../../actions/meeting.actions";
import { MeetingSettingsChecklist } from "./meeting-settings-checklist";

export function ScheduleMeetingForm() {
  const [state, formAction, pending] = useActionState(createMeetingAction, null);
  const [meetingType, setMeetingType] = useState<"SCHEDULED" | "RECURRING">("SCHEDULED");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Meeting scheduled successfully! Access code: {state.slug}</span>
        </div>
      )}

      <input type="hidden" name="type" value={meetingType} />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Meeting Topic</label>
        <input
          name="title"
          required
          placeholder="e.g. Q3 Strategic Planning & Roadmap"
          className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Description (Optional)</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Agenda and notes for participants..."
          className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Schedule Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMeetingType("SCHEDULED")}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                meetingType === "SCHEDULED"
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
                  : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
              }`}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setMeetingType("RECURRING")}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors ${
                meetingType === "RECURRING"
                  ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
                  : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
              }`}
            >
              Recurring
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Access Level</label>
          <select
            name="accessLevel"
            defaultValue="PUBLIC"
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="PUBLIC">Public (Anyone with link)</option>
            <option value="PRIVATE">Private (Password Protected)</option>
            <option value="INVITE_ONLY">Invite Only (Registered emails)</option>
          </select>
        </div>
      </div>

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
      </div>

      {meetingType === "RECURRING" && (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
          <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Recurrence Frequency</label>
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

      <MeetingSettingsChecklist />

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Calendar className="w-4 h-4" />
        <span>{pending ? "Scheduling..." : "Schedule Meeting"}</span>
      </button>
    </form>
  );
}
