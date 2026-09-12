import React from "react";
import { Clock, Users, ShieldCheck, HardDrive } from "lucide-react";
import { StatCard } from "../../../components/common/stat-card";

interface AnalyticsKpisProps {
  meetings: any;
  participants: any;
  quality: any;
  recordings: any;
}

export function AnalyticsKpis({
  meetings,
  participants,
  quality,
  recordings,
}: AnalyticsKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        label="Meeting Duration"
        value={`${meetings.totalDurationMinutes || 0}m`}
        icon={<Clock className="w-5 h-5 text-indigo-400" />}
        subtitle={`${meetings.avgDurationMinutes || 0}m avg • ${meetings.total || 0} total sessions`}
      />

      <StatCard
        label="Total Participants"
        value={participants.total || 0}
        icon={<Users className="w-5 h-5 text-blue-400" />}
        subtitle={`${participants.peakAttendance || 0} peak • ${participants.avgPerMeeting || 0} avg / room`}
      />

      <StatCard
        label="Quality & Health"
        value={`${quality.healthScore || 98}%`}
        icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        badge={
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
            Optimal
          </span>
        }
        subtitle={`${quality.avgPacketLossPercent || 0}% loss • ${quality.avgJitterMs || 14}ms jitter`}
      />

      <StatCard
        label="Cloud Storage"
        value={`${recordings.totalStorageMb || 0} MB`}
        icon={<HardDrive className="w-5 h-5 text-purple-400" />}
        subtitle={`${recordings.totalRecordings || 0} files • ${recordings.totalDurationHours || 0} hrs saved`}
      />
    </div>
  );
}
