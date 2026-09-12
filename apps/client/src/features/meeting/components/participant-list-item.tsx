"use client";

import { Hand, ShieldCheck, Sparkles, Shield } from "lucide-react";
import type { ParticipantDTO } from "@meet/shared-types";
import { ParticipantItemActions } from "./participant-item-actions";

interface ParticipantListItemProps {
  participant: ParticipantDTO;
  isHost: boolean;
  myRole: string;
  isPinned: boolean;
  isSpotlighted: boolean;
  onTogglePin: () => void;
  onKickParticipant?: (participantId: string) => void;
  onControlParticipantMedia?: (participantId: string, mediaType: "audio" | "video", muted: boolean) => void;
  onPromoteParticipant?: (participantId: string, role: "CO_HOST" | "PARTICIPANT") => void;
  onSpotlightParticipant?: (participantId: string | null) => void;
  onReportParticipant?: (participant: { id: string; name: string }) => void;
}

export function ParticipantListItem({
  participant: p,
  isHost,
  myRole,
  isPinned,
  isSpotlighted,
  onTogglePin,
  onKickParticipant,
  onControlParticipantMedia,
  onPromoteParticipant,
  onSpotlightParticipant,
  onReportParticipant,
}: ParticipantListItemProps) {
  return (
    <div
      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
        isSpotlighted
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-neutral-800/20 border-white/5 hover:bg-neutral-800/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
          {(p.displayName || "P").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className="text-white text-sm font-medium truncate block">
            {p.displayName || "Participant"}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {p.role === "HOST" && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-medium flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Host
              </span>
            )}
            {p.role === "CO_HOST" && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-medium flex items-center gap-0.5">
                <Shield className="w-3 h-3" /> Co-host
              </span>
            )}
            {isSpotlighted && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-medium flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> Spotlight
              </span>
            )}
            {p.isHandRaised && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-medium flex items-center gap-0.5">
                <Hand className="w-3 h-3" /> Hand raised
              </span>
            )}
          </div>
        </div>
      </div>

      <ParticipantItemActions
        participant={p}
        isHost={isHost}
        myRole={myRole}
        isPinned={isPinned}
        isSpotlighted={isSpotlighted}
        onTogglePin={onTogglePin}
        onKickParticipant={onKickParticipant}
        onControlParticipantMedia={onControlParticipantMedia}
        onPromoteParticipant={onPromoteParticipant}
        onSpotlightParticipant={onSpotlightParticipant}
        onReportParticipant={onReportParticipant}
      />
    </div>
  );
}
