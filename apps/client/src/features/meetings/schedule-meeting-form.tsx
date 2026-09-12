"use client";

import { useActionState, useState } from "react";
import {
  Calendar,
  Clock,
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Repeat,
} from "lucide-react";
import { createMeetingAction } from "../../actions/meeting.actions";
import { MeetingSettingsChecklist } from "./meeting-settings-checklist";

export function ScheduleMeetingForm() {
  const [state, formAction, pending] = useActionState(createMeetingAction, null);
  const [meetingType, setMeetingType] = useState<"INSTANT" | "SCHEDULED" | "RECURRING">("SCHEDULED");
  const [accessLevel, setAccessLevel] = useState<"PUBLIC" | "PRIVATE" | "INVITE_ONLY">("PUBLIC");
  const [passcode, setPasscode] = useState("");

  const generatePasscode = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setPasscode(pin);
  };

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
          <span>Meeting created successfully! Meeting code: <strong className="font-mono">{state.slug}</strong></span>
        </div>
      )}

      <input type="hidden" name="type" value={meetingType} />
      <input type="hidden" name="accessLevel" value={accessLevel} />

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
      {meetingType !== "INSTANT" && (
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
      )}

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

      {/* Access Level / Type Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Meeting Access Type</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAccessLevel("PUBLIC")}
            className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
              accessLevel === "PUBLIC"
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-300"
                : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <span className="font-semibold text-xs">Public</span>
            <span className="text-[11px] text-neutral-500 leading-tight">Anyone with link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAccessLevel("PRIVATE");
              if (!passcode) generatePasscode();
            }}
            className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
              accessLevel === "PRIVATE"
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-300"
                : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <span className="font-semibold text-xs">Private</span>
            <span className="text-[11px] text-neutral-500 leading-tight">PIN / Passcode required</span>
          </button>

          <button
            type="button"
            onClick={() => setAccessLevel("INVITE_ONLY")}
            className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
              accessLevel === "INVITE_ONLY"
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-300"
                : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <span className="font-semibold text-xs">Invite Only</span>
            <span className="text-[11px] text-neutral-500 leading-tight">Whitelisted attendees</span>
          </button>
        </div>
      </div>

      {/* Passcode input for Private */}
      {accessLevel === "PRIVATE" && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Meeting Passcode / PIN</span>
            </label>
            <button
              type="button"
              onClick={generatePasscode}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
            >
              Regenerate PIN
            </button>
          </div>
          <input
            name="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            required
            placeholder="e.g. 849201"
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-base tracking-wider focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[11px] text-neutral-500">Participants will need to provide this code in the lobby to enter.</span>
        </div>
      )}

      {/* Invite emails for Invite Only */}
      {accessLevel === "INVITE_ONLY" && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Invited Emails</span>
          </label>
          <textarea
            name="inviteEmails"
            rows={2}
            placeholder="colleague@company.com, client@partner.org (comma-separated)"
            required
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
          />
          <span className="text-[11px] text-neutral-500">Only participants with these email addresses will be admitted.</span>
        </div>
      )}

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
