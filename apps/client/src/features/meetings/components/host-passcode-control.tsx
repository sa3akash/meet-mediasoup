"use client";

import { KeyRound, RefreshCw, Check } from "lucide-react";

interface HostPasscodeControlProps {
  passcode: string;
  setPasscode: (code: string) => void;
  onGeneratePasscode: () => void;
  onSavePasscode: (code: string | null) => void;
  isSavingPasscode: boolean;
  passcodeFeedback: string | null;
}

export function HostPasscodeControl({
  passcode,
  setPasscode,
  onGeneratePasscode,
  onSavePasscode,
  isSavingPasscode,
  passcodeFeedback,
}: HostPasscodeControlProps) {
  return (
    <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white text-xs font-semibold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            Meeting Password / Passcode
          </h4>
          <p className="text-neutral-400 text-[11px] mt-0.5">
            Require participants to enter a PIN or secret password to join
          </p>
        </div>
        {passcode && (
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
            PROTECTED
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Set room password / PIN (e.g. 123456)"
            className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider"
          />
        </div>
        <button
          type="button"
          onClick={onGeneratePasscode}
          title="Generate random PIN"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={isSavingPasscode}
          onClick={() => onSavePasscode(passcode.trim())}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
        {passcode && (
          <button
            type="button"
            disabled={isSavingPasscode}
            onClick={() => onSavePasscode(null)}
            className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs transition-colors"
            title="Remove password"
          >
            Clear
          </button>
        )}
      </div>

      {passcodeFeedback && (
        <p className="text-[11px] text-emerald-400 font-medium animate-in fade-in">
          {passcodeFeedback}
        </p>
      )}
    </div>
  );
}
