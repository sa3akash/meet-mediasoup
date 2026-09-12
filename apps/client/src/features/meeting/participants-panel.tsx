"use client";

import { useState } from "react";
import { X, Search, Mic, MicOff, Video, VideoOff, Hand, Pin, ShieldCheck } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";

interface ParticipantsPanelProps {
  localDisplayName: string;
}

export function ParticipantsPanel({ localDisplayName }: ParticipantsPanelProps) {
  const [search, setSearch] = useState("");
  const {
    participants,
    pinnedParticipantId,
    setPinnedParticipant,
    toggleParticipantsList,
    isHandRaised,
    isHost,
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
        <button
          onClick={toggleParticipantsList}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isHost && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-medium flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Meeting host
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
          return (
            <div
              key={p.id}
              className="p-2.5 rounded-xl bg-neutral-800/20 border border-white/5 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  {(p.displayName || "P").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-white text-sm font-medium truncate block">
                    {p.displayName || "Participant"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.role === "HOST" && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-medium flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Host
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
                <button
                  onClick={() => setPinnedParticipant(isPinned ? null : p.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isPinned ? "bg-white text-black" : "hover:bg-white/10 hover:text-white"
                  }`}
                  title={isPinned ? "Unpin participant" : "Pin participant"}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <div className={`p-1.5 rounded-lg ${p.isAudioMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
                  {p.isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </div>
                <div className={`p-1.5 rounded-lg ${p.isVideoMuted ? "text-red-400 bg-red-500/10" : "text-white/70"}`}>
                  {p.isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </div>
              </div>
            </div>
          );
        })}

        {filteredParticipants.length === 0 && search && (
          <div className="py-8 text-center text-xs text-white/40">
            No participants match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
