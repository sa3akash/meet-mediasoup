"use client";

import { useState } from "react";
import { KeyRound, Mail, Loader2, Eye, EyeOff } from "lucide-react";

interface LobbyFormProps {
  name: string;
  setName: (name: string) => void;
  passcode: string;
  setPasscode: (code: string) => void;
  email: string;
  setEmail: (email: string) => void;
  accessLevel: string;
  hasPasscode: boolean;
  isVerifying: boolean;
  waitingRoomEnabled: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function LobbyForm({
  name,
  setName,
  passcode,
  setPasscode,
  email,
  setEmail,
  accessLevel,
  hasPasscode,
  isVerifying,
  waitingRoomEnabled,
  onSubmit,
}: LobbyFormProps) {
  const [showPasscode, setShowPasscode] = useState(false);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-xs font-semibold uppercase tracking-wider text-white/70">
          Your Display Name
        </label>
        <input
          id="displayName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          required
          className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
        />
      </div>

      {(accessLevel === "PRIVATE" || hasPasscode) && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="passcode" className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Meeting Password / Passcode</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-normal normal-case">Required to join</span>
          </label>
          <div className="relative flex items-center">
            <input
              id="passcode"
              type={showPasscode ? "text" : "password"}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter meeting password or PIN"
              required
              className="w-full bg-neutral-900 border border-white/10 focus:border-amber-500 rounded-2xl pl-4 pr-11 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm font-mono tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
              title={showPasscode ? "Hide password" : "Show password"}
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {accessLevel === "INVITE_ONLY" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Invited Email Address</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter the email your invite was sent to"
            required
            className="w-full bg-neutral-900 border border-white/10 focus:border-blue-500 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={!name.trim() || isVerifying}
          className="flex-1 py-3.5 px-6 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95"
        >
          {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isVerifying ? "Verifying Access..." : waitingRoomEnabled ? "Ask to Join" : "Join Now"}</span>
        </button>
      </div>
    </form>
  );
}
