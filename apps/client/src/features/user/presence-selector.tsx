"use client";

import { useState } from "react";
import { updatePresenceAction } from "../../actions/user.actions";

const PRESENCE_CONFIG = {
  ONLINE: { label: "Online", color: "bg-emerald-500" },
  AWAY: { label: "Away", color: "bg-amber-500" },
  BUSY: { label: "Busy / In Meeting", color: "bg-red-500" },
  OFFLINE: { label: "Appear Offline", color: "bg-neutral-500" },
} as const;

type Status = keyof typeof PRESENCE_CONFIG;

export function PresenceSelector({ initialStatus = "ONLINE" }: { initialStatus?: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [open, setOpen] = useState(false);

  const handleSelect = async (next: Status) => {
    setStatus(next);
    setOpen(false);
    await updatePresenceAction(next);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-neutral-800 border border-white/10 hover:border-white/20 text-xs font-medium text-white transition-colors"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${PRESENCE_CONFIG[status].color}`} />
        <span>{PRESENCE_CONFIG[status].label}</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-48 rounded-2xl bg-neutral-900 border border-white/10 p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95">
          {(Object.keys(PRESENCE_CONFIG) as Status[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/90 hover:bg-neutral-800 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${PRESENCE_CONFIG[key].color}`} />
              <span>{PRESENCE_CONFIG[key].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
