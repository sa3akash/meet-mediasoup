import React from "react";

interface AdminMeetingsTabProps {
  meetingsList: any[];
  meetingFilter: string;
  setMeetingFilter: (filter: string) => void;
  onFilterChange: (filter: string) => void;
  onTerminateMeeting: (meetingId: string) => void;
}

export function AdminMeetingsTab({
  meetingsList,
  meetingFilter,
  setMeetingFilter,
  onFilterChange,
  onTerminateMeeting,
}: AdminMeetingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-900 border border-white/5">
        <button
          onClick={() => {
            setMeetingFilter("ACTIVE");
            onFilterChange("ACTIVE");
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            meetingFilter === "ACTIVE"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Active Live Rooms
        </button>
        <button
          onClick={() => {
            setMeetingFilter("");
            onFilterChange("");
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            meetingFilter === ""
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          All Meetings
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-800/60 text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Title & Code</th>
              <th className="p-3.5">Host</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Live Participants</th>
              <th className="p-3.5">Created</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {meetingsList.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500">
                  No meetings found
                </td>
              </tr>
            ) : (
              meetingsList.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{m.title}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">/{m.slug}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-white">{m.hostName || "Host"}</div>
                    <div className="text-[11px] text-neutral-500">{m.hostEmail}</div>
                  </td>
                  <td className="p-3.5">
                    {m.status === "ACTIVE" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold border border-white/5">
                        {m.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-semibold text-white">
                    {m.activeParticipantsCount ?? 0} connected
                  </td>
                  <td className="p-3.5 text-neutral-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    {m.status === "ACTIVE" && (
                      <button
                        onClick={() => onTerminateMeeting(m.id)}
                        className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/30 transition-all"
                      >
                        End Room
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
