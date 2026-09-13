"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pin,
  UserX,
  Sparkles,
  Shield,
  Flag,
} from "lucide-react";
import type { ParticipantDTO } from "@meet/shared-types";

interface ParticipantItemActionsProps {
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

export function ParticipantItemActions({
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
}: ParticipantItemActionsProps) {
  const isCoHost = p.role === "CO_HOST";

  return (
    <div className="flex items-center gap-1 text-white/60">
      {Boolean(myRole === "HOST" && onPromoteParticipant && p.role !== "HOST") && (
        <button
          onClick={() => {
            const nextRole = isCoHost ? "PARTICIPANT" : "CO_HOST";
            const actionLabel = isCoHost ? "demote from co-host" : "promote to co-host";
            if (confirm(`Do you want to ${actionLabel} ${p.displayName || "Participant"}?`)) {
              onPromoteParticipant?.(p.id, nextRole);
            }
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isCoHost ? "text-blue-400 bg-blue-500/15" : "text-white/40 hover:text-blue-400"
          }`}
          title={isCoHost ? "Demote from Co-host" : "Promote to Co-host"}
        >
          <Shield className="w-4 h-4" />
        </button>
      )}

      {Boolean(isHost && onSpotlightParticipant) && (
        <button
          onClick={() => onSpotlightParticipant?.(isSpotlighted ? null : p.id)}
          className={`p-1.5 rounded-lg transition-colors ${
            isSpotlighted ? "text-amber-400 bg-amber-500/20" : "text-white/40 hover:text-amber-400"
          }`}
          title={isSpotlighted ? "Remove spotlight" : "Spotlight for everyone"}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}

      {Boolean(isHost && onKickParticipant && p.role !== "HOST") && (
        <button
          onClick={() => {
            if (confirm(`Remove ${p.displayName || "Participant"}?`)) {
              onKickParticipant?.(p.id);
            }
          }}
          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remove participant"
        >
          <UserX className="w-4 h-4" />
        </button>
      )}

      {Boolean(onReportParticipant) && (
        <button
          onClick={() => onReportParticipant?.({ id: p.id, name: p.displayName || "Participant" })}
          className="p-1.5 rounded-lg text-white/40 hover:text-amber-400 transition-colors"
          title="Report participant"
        >
          <Flag className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={onTogglePin}
        className={`p-1.5 rounded-lg transition-colors ${
          isPinned ? "bg-white text-black" : "hover:bg-white/10 hover:text-white"
        }`}
        title={isPinned ? "Unpin" : "Pin"}
      >
        <Pin className="w-4 h-4" />
      </button>

      {Boolean(isHost && onControlParticipantMedia) ? (
        <button
          onClick={() => onControlParticipantMedia?.(p.id, "audio", !p.isAudioMuted)}
          className={`p-1.5 rounded-lg transition-colors ${
            p.isAudioMuted ? "text-red-400 bg-red-500/10" : "text-white/70 hover:bg-white/10"
          }`}
          title={p.isAudioMuted ? "Ask to unmute" : "Mute participant"}
        >
          {p.isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      ) : (
        <div className={`p-1.5 rounded-lg ${p.isAudioMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
          {p.isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </div>
      )}

      {Boolean(isHost && onControlParticipantMedia) ? (
        <button
          onClick={() => onControlParticipantMedia?.(p.id, "video", !p.isVideoMuted)}
          className={`p-1.5 rounded-lg transition-colors ${
            p.isVideoMuted ? "text-red-400 bg-red-500/10" : "text-white/70 hover:bg-white/10"
          }`}
          title={p.isVideoMuted ? "Ask camera on" : "Turn off camera"}
        >
          {p.isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </button>
      ) : (
        <div className={`p-1.5 rounded-lg ${p.isVideoMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
          {p.isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </div>
      )}
    </div>
  );
}
