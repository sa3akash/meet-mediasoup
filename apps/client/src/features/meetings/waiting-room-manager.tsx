"use client";

import { useState } from "react";
import { UserCheck, UserX, Users, CheckCheck } from "lucide-react";
import { admitWaitingParticipantAction, rejectWaitingParticipantAction } from "../../actions/meeting-controls.actions";

interface WaitingUser {
  id: string;
  displayName: string;
  joinedAt: string;
}

interface Props {
  meetingId: string;
  hostId: string;
  initialWaitingUsers?: WaitingUser[];
}

export function WaitingRoomManager({ meetingId, hostId, initialWaitingUsers = [] }: Props) {
  const [users, setUsers] = useState<WaitingUser[]>(initialWaitingUsers);

  if (users.length === 0) return null;

  const handleAdmit = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await admitWaitingParticipantAction(meetingId, id, hostId);
  };

  const handleReject = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await rejectWaitingParticipantAction(meetingId, id, hostId);
  };

  const handleAdmitAll = async () => {
    const userIds = [...users];
    setUsers([]);
    for (const u of userIds) {
      await admitWaitingParticipantAction(meetingId, u.id, hostId);
    }
  };

  return (
    <div className="absolute top-20 right-6 z-40 w-80 bg-neutral-900/95 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-xs">Waiting Room</h4>
            <p className="text-neutral-400 text-[10px]">{users.length} waiting to join</p>
          </div>
        </div>
        <button
          onClick={handleAdmitAll}
          className="text-indigo-400 hover:text-indigo-300 text-[11px] font-medium flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Admit all</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-950/50 border border-white/5">
            <div className="truncate pr-2">
              <span className="text-neutral-200 text-xs font-medium block truncate">{u.displayName}</span>
              <span className="text-neutral-500 text-[10px]">Guest</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleAdmit(u.id)}
                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                title="Admit"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleReject(u.id)}
                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                title="Reject"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
