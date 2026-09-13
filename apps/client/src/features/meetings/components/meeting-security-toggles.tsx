"use client";

import { KeyRound, Mail } from "lucide-react";

interface MeetingSecurityTogglesProps {
  accessLevel: "PUBLIC" | "PRIVATE" | "INVITE_ONLY";
  setAccessLevel: (level: "PUBLIC" | "PRIVATE" | "INVITE_ONLY") => void;
  passcode: string;
  setPasscode: (code: string) => void;
  generatePasscode: () => void;
}

export function MeetingSecurityToggles({
  accessLevel,
  setAccessLevel,
  passcode,
  setPasscode,
  generatePasscode,
}: MeetingSecurityTogglesProps) {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
