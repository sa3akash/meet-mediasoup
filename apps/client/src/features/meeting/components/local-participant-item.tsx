"use client";

import { Mic, MicOff, Video, VideoOff, Hand, ShieldCheck, ShieldAlert } from "lucide-react";

interface LocalParticipantItemProps {
  localDisplayName: string;
  myRole: string;
  isHandRaised: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
}

export function LocalParticipantItem({
  localDisplayName,
  myRole,
  isHandRaised,
  isAudioMuted,
  isVideoMuted,
}: LocalParticipantItemProps) {
  return (
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
  );
}
