"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface AnalyticsMeetingsTableProps {
  recentMeetings: any[];
}

export function AnalyticsMeetingsTable({ recentMeetings }: AnalyticsMeetingsTableProps) {
  const meetings = recentMeetings || [];

  return (
    <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Recent Session Performance</h3>
          <p className="text-xs text-neutral-400">Live & past meeting performance health</p>
        </div>
        <Link
          href="/meetings"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="border-b border-white/5 text-neutral-500 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Meeting</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Participants</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Quality Rating</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-500">
                  No meeting session records yet.
                </td>
              </tr>
            ) : (
              meetings.map((m: any) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{m.title}</td>
                  <td className="py-3.5 px-4 font-mono text-indigo-300">{m.slug}</td>
                  <td className="py-3.5 px-4">{m.participantsCount || 1} joined</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/5 text-neutral-400 border border-white/10"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                      98% EXCELLENT
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/meeting/${m.slug}`}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Join Room
                    </Link>
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
