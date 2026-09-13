import React from "react";
import {
  Users,
  Video,
  HardDrive,
  Disc,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { formatBytes, formatDuration, type AdminTab } from "../admin-types";
import { StatCard } from "../../../components/common/stat-card";

interface AdminOverviewTabProps {
  overview: any;
  setActiveTab: (tab: AdminTab) => void;
}

export function AdminOverviewTab({ overview, setActiveTab }: AdminOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={overview?.users?.total ?? 0}
          icon={<Users className="w-5 h-5 text-indigo-400" />}
          subtitle={`${overview?.users?.banned ?? 0} suspended users`}
        />

        <StatCard
          label="Active Meetings"
          value={overview?.meetings?.activeNow ?? 0}
          icon={<Video className="w-5 h-5 text-emerald-400" />}
          badge={
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          }
          subtitle={`${overview?.meetings?.total ?? 0} total meetings hosted`}
        />

        <StatCard
          label="Total Storage"
          value={formatBytes(overview?.storage?.totalBytes || 0)}
          icon={<HardDrive className="w-5 h-5 text-cyan-400" />}
          subtitle={`${overview?.storage?.totalFiles || 0} media assets in S3 / local`}
        />

        <StatCard
          label="Cloud Recordings"
          value={overview?.recordings?.total ?? 0}
          icon={<Disc className="w-5 h-5 text-purple-400" />}
          subtitle={`${formatDuration(overview?.recordings?.totalDurationSeconds || 0)} total recorded video`}
        />

        <StatCard
          label="Pending Reports"
          value={overview?.moderation?.pendingReports ?? 0}
          icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
          subtitle="Awaiting moderation review"
        />

        <StatCard
          label="Audit Events"
          value={overview?.auditLogs?.total ?? 0}
          icon={<FileText className="w-5 h-5 text-amber-400" />}
          subtitle="Immutable security audit trail"
        />
      </div>

      <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5">
        <h3 className="text-base font-semibold text-white mb-3">Enterprise Administration Shortcuts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className="p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 text-left transition-colors flex items-center gap-3"
          >
            <Users className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">Manage Users</div>
              <div className="text-xs text-neutral-400">Promote roles & ban accounts</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("moderation")}
            className="p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 text-left transition-colors flex items-center gap-3"
          >
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">Moderation Queue</div>
              <div className="text-xs text-neutral-400">Review spam and user reports</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("meetings")}
            className="p-4 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 text-left transition-colors flex items-center gap-3"
          >
            <Video className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-white">Live Meetings</div>
              <div className="text-xs text-neutral-400">Monitor active rooms & participants</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
