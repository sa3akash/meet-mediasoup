import React, { useState } from "react";
import { Boxes, Clock, Volume2, Send, StopCircle } from "lucide-react";

interface BreakoutActivityTabProps {
  currentBreakoutRoom?: { id: string; name: string } | null;
  breakoutState?: any;
  isHost: boolean;
  onOpenBreakoutSetup?: () => void;
  onBroadcastBreakout?: (msg: string) => Promise<any>;
  onEndBreakout?: () => Promise<any>;
}

export function BreakoutActivityTab({
  currentBreakoutRoom,
  breakoutState,
  isHost,
  onOpenBreakoutSetup,
  onBroadcastBreakout,
  onEndBreakout,
}: BreakoutActivityTabProps) {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !onBroadcastBreakout) return;
    try {
      setIsBroadcasting(true);
      await onBroadcastBreakout(broadcastMsg.trim());
      setBroadcastMsg("");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const hasActiveRooms = Boolean(breakoutState?.rooms?.length);

  return (
    <div className="space-y-4">
      {currentBreakoutRoom && (
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-white space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Current Room</span>
          <h4 className="text-base font-bold">{currentBreakoutRoom.name}</h4>
        </div>
      )}

      {hasActiveRooms ? (
        <div className="space-y-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                Breakout Active ({breakoutState.rooms.length} rooms)
              </span>
            </div>
            {breakoutState.durationMinutes && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Clock className="w-3.5 h-3.5" />
                <span>{breakoutState.durationMinutes}m</span>
              </div>
            )}
          </div>

          {isHost && onBroadcastBreakout && (
            <form onSubmit={handleBroadcast} className="p-3.5 rounded-2xl bg-neutral-800/80 border border-white/10 space-y-2">
              <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Broadcast to all breakout rooms</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="e.g. 2 minutes remaining!"
                  className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isBroadcasting || !broadcastMsg.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">Rooms</span>
            {breakoutState.rooms.map((room: any) => (
              <div key={room.id} className="p-3 rounded-xl bg-neutral-800/40 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">{room.name}</span>
                  <span className="text-[11px] text-neutral-400">{room.participantIds.length} assigned</span>
                </div>
              </div>
            ))}
          </div>

          {isHost && onEndBreakout && (
            <button
              onClick={() => confirm("End all breakout rooms?") && onEndBreakout()}
              className="w-full py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <StopCircle className="w-4 h-4" /> End Breakout Rooms
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12 px-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mx-auto">
            <Boxes className="w-6 h-6" />
          </div>
          <h4 className="text-white text-sm font-medium">Breakout Rooms</h4>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
            Split participants into smaller group rooms for brainstorming and discussions.
          </p>
          {isHost && onOpenBreakoutSetup && (
            <button
              onClick={onOpenBreakoutSetup}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
            >
              Set up breakout rooms
            </button>
          )}
        </div>
      )}
    </div>
  );
}
