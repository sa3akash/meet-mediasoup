"use client";

import { useState } from "react";
import {
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Pin,
  ShieldCheck,
  ShieldAlert,
  UserX,
  Sparkles,
  Shield,
} from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";

interface ParticipantsPanelProps {
  localDisplayName: string;
  onKickParticipant?: (participantId: string) => void;
  onControlParticipantMedia?: (participantId: string, mediaType: "audio" | "video", muted: boolean) => void;
  onMuteAll?: () => void;
  onPromoteParticipant?: (participantId: string, role: "CO_HOST" | "PARTICIPANT") => void;
  onSpotlightParticipant?: (participantId: string | null) => void;
}

export function ParticipantsPanel({
  localDisplayName,
  onKickParticipant,
  onControlParticipantMedia,
  onMuteAll,
  onPromoteParticipant,
  onSpotlightParticipant,
}: ParticipantsPanelProps) {
  const [search, setSearch] = useState("");
  const {
    participants,
    pinnedParticipantId,
    spotlightParticipantId,
    setPinnedParticipant,
    toggleParticipantsList,
    isHandRaised,
    isHost,
    myRole,
  } = useMeetingStore();

  const { isAudioMuted, isVideoMuted } = useMediaStore();

  const participantList = Array.from(participants.values());
  const filteredParticipants = participantList.filter((p) =>
    (p.displayName || "Participant").toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = participantList.length + 1;

  return (
    <div className="w-80 md:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-base">People</h3>
          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-white/70 text-xs font-semibold">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Boolean(isHost && onMuteAll && participantList.length > 0) && (
            <button
              onClick={() => {
                if (confirm("Mute all participants?")) {
                  onMuteAll?.();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/20"
              title="Mute all participants"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>Mute all</span>
            </button>
          )}
          <button
            onClick={toggleParticipantsList}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-3 border-b border-white/10 bg-neutral-900/50">
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for people"
            className="w-full bg-neutral-800 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 pt-1 pb-1">
          In Call ({totalCount})
        </div>

        {/* Local User */}
        {(!search || localDisplayName.toLowerCase().includes(search.toLowerCase())) && (
          <div className="p-2.5 rounded-xl bg-neutral-800/40 border border-white/5 flex items-center justify-between hover:bg-neutral-800/70 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                {(localDisplayName || "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">{localDisplayName || "You"}</span>
                  <span className="text-white/40 text-xs shrink-0">(You)</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {myRole === "HOST" && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Meeting host
                    </span>
                  )}
                  {myRole === "CO_HOST" && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-medium flex items-center gap-0.5">
                      <ShieldAlert className="w-3 h-3" /> Co-host
                    </span>
                  )}
                  {isHandRaised && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-medium flex items-center gap-0.5">
                      <Hand className="w-3 h-3" /> Hand raised
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media status */}
            <div className="flex items-center gap-1 text-white/60">
              <div className={`p-1.5 rounded-lg ${isAudioMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </div>
              <div className={`p-1.5 rounded-lg ${isVideoMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </div>
            </div>
          </div>
        )}

        {/* Remote Participants */}
        {filteredParticipants.map((p) => {
          const isPinned = pinnedParticipantId === p.id;
          const isSpotlighted = spotlightParticipantId === p.id;
          const isCoHost = p.role === "CO_HOST";

          return (
            <div
              key={p.id}
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

              {/* Actions & Media Status */}
              <div className="flex items-center gap-1 text-white/60">
                {/* Promote to Co-Host (Only original HOST can promote/demote) */}
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
                      isCoHost
                        ? "text-blue-400 bg-blue-500/15 hover:bg-blue-500/25"
                        : "text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
                    }`}
                    title={isCoHost ? "Demote from Co-host" : "Promote to Co-host"}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                )}

                {/* Spotlight Participant (Host & Co-Host) */}
                {Boolean(isHost && onSpotlightParticipant) && (
                  <button
                    onClick={() => {
                      onSpotlightParticipant?.(isSpotlighted ? null : p.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSpotlighted
                        ? "text-amber-400 bg-amber-500/20 hover:bg-amber-500/30"
                        : "text-white/40 hover:text-amber-400 hover:bg-amber-500/10"
                    }`}
                    title={isSpotlighted ? "Remove spotlight for everyone" : "Spotlight for everyone"}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}

                {/* Kick Participant */}
                {Boolean(isHost && onKickParticipant && p.role !== "HOST") && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${p.displayName || "Participant"} from this meeting?`)) {
                        onKickParticipant?.(p.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={`Remove ${p.displayName || "Participant"}`}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}

                {/* Pin toggle */}
                <button
                  onClick={() => setPinnedParticipant(isPinned ? null : p.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isPinned ? "bg-white text-black" : "hover:bg-white/10 hover:text-white"
                  }`}
                  title={isPinned ? "Unpin participant" : "Pin participant"}
                >
                  <Pin className="w-4 h-4" />
                </button>

                {/* Audio Control / Status */}
                {Boolean(isHost && onControlParticipantMedia) ? (
                  <button
                    onClick={() => {
                      if (!p.isAudioMuted) {
                        onControlParticipantMedia?.(p.id, "audio", true);
                      } else {
                        onControlParticipantMedia?.(p.id, "audio", false);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      p.isAudioMuted
                        ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    title={p.isAudioMuted ? "Ask to unmute microphone" : "Mute participant"}
                  >
                    {p.isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className={`p-1.5 rounded-lg ${p.isAudioMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
                    {p.isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </div>
                )}

                {/* Video Control / Status */}
                {Boolean(isHost && onControlParticipantMedia) ? (
                  <button
                    onClick={() => {
                      if (!p.isVideoMuted) {
                        onControlParticipantMedia?.(p.id, "video", true);
                      } else {
                        onControlParticipantMedia?.(p.id, "video", false);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      p.isVideoMuted
                        ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    title={p.isVideoMuted ? "Ask to turn on camera" : "Turn off participant camera"}
                  >
                    {p.isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className={`p-1.5 rounded-lg ${p.isVideoMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
                    {p.isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredParticipants.length === 0 && search && (
          <div className="py-8 text-center text-xs text-white/40">
            No participants match &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
