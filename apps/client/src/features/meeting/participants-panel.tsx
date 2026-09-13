"use client";

import { useState } from "react";
import { X, Search, MicOff } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { ParticipantListItem } from "./components/participant-list-item";
import { LocalParticipantItem } from "./components/local-participant-item";

interface ParticipantsPanelProps {
  localDisplayName: string;
  onKickParticipant?: (participantId: string) => void;
  onControlParticipantMedia?: (participantId: string, mediaType: "audio" | "video", muted: boolean) => void;
  onMuteAll?: () => void;
  onPromoteParticipant?: (participantId: string, role: "CO_HOST" | "PARTICIPANT") => void;
  onSpotlightParticipant?: (participantId: string | null) => void;
  onReportParticipant?: (participant: { id: string; name: string }) => void;
}

export function ParticipantsPanel({
  localDisplayName,
  onKickParticipant,
  onControlParticipantMedia,
  onMuteAll,
  onPromoteParticipant,
  onSpotlightParticipant,
  onReportParticipant,
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
    <div className="fixed inset-0 md:relative md:inset-auto w-full md:w-80 lg:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-40 md:z-30 animate-in slide-in-from-right duration-200">
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
          <LocalParticipantItem
            localDisplayName={localDisplayName}
            myRole={myRole}
            isHandRaised={isHandRaised}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
          />
        )}

        {/* Remote Participants */}
        {filteredParticipants.map((p) => (
          <ParticipantListItem
            key={p.id}
            participant={p}
            isHost={isHost}
            myRole={myRole}
            isPinned={pinnedParticipantId === p.id}
            isSpotlighted={spotlightParticipantId === p.id}
            onTogglePin={() => setPinnedParticipant(pinnedParticipantId === p.id ? null : p.id)}
            onKickParticipant={onKickParticipant}
            onControlParticipantMedia={onControlParticipantMedia}
            onPromoteParticipant={onPromoteParticipant}
            onSpotlightParticipant={onSpotlightParticipant}
            onReportParticipant={onReportParticipant}
          />
        ))}

        {filteredParticipants.length === 0 && search && (
          <div className="py-8 text-center text-xs text-white/40">
            No participants match &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
