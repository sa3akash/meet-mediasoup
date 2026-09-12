"use client";

import { Users } from "lucide-react";
import type { ParticipantDTO } from "@meet/shared-types";

interface BreakoutRoomItemProps {
  roomIndex: number;
  assignedParticipants: ParticipantDTO[];
}

export function BreakoutRoomItem({
  roomIndex,
  assignedParticipants,
}: BreakoutRoomItemProps) {
  return (
    <div className="p-3 rounded-2xl bg-neutral-800/50 border border-white/5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">
          Breakout Room {roomIndex + 1}
        </span>
        <span className="text-[11px] text-white/50 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {assignedParticipants.length} people
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {assignedParticipants.length > 0 ? (
          assignedParticipants.map((p) => (
            <span
              key={p.id}
              className="px-2 py-0.5 rounded-lg bg-neutral-900 text-white/80 text-[11px] border border-white/5"
            >
              {p.displayName || "Participant"}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-white/30 italic">
            No participants assigned yet
          </span>
        )}
      </div>
    </div>
  );
}
