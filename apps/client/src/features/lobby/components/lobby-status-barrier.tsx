"use client";

import { Clock, Loader2, Lock } from "lucide-react";

interface LobbyStatusBarrierProps {
  type: "WAITING_ROOM" | "LOCKED";
  name?: string;
  onCancelWaiting?: () => void;
}

export function LobbyStatusBarrier({
  type,
  name,
  onCancelWaiting,
}: LobbyStatusBarrierProps) {
  if (type === "WAITING_ROOM") {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-white text-xl font-bold">Waiting to be admitted...</h2>
            <p className="text-neutral-400 text-xs mt-1.5">
              The meeting host has been notified that you are waiting. You will join automatically once approved.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/5 w-full flex items-center justify-between text-xs">
            <span className="text-neutral-400">Joining as:</span>
            <span className="text-white font-medium">{name}</span>
          </div>

          <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to host lobby...</span>
          </div>

          {onCancelWaiting && (
            <button
              onClick={onCancelWaiting}
              className="text-neutral-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel & Return to Lobby
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-6 text-center animate-in fade-in">
      <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-amber-500/20 shadow-2xl flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-white text-xl font-bold">Meeting is Locked</h2>
          <p className="text-neutral-400 text-xs mt-1.5">
            The host has locked this meeting room. No additional participants can enter at this time.
          </p>
        </div>

        <a
          href="/meetings"
          className="w-full py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
        >
          Back to Meetings Dashboard
        </a>
      </div>
    </div>
  );
}
