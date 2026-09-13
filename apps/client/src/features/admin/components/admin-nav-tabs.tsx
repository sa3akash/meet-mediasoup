import React from "react";
import {
  Users,
  Video,
  Disc,
  HardDrive,
  ShieldAlert,
  FileText,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import type { AdminTab } from "../admin-types";

interface AdminNavTabsProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  loading: boolean;
  onRefresh: () => void;
}

const TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users & RBAC", icon: Users },
  { id: "meetings", label: "Meetings", icon: Video },
  { id: "recordings", label: "Recordings", icon: Disc },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "moderation", label: "Moderation", icon: ShieldAlert },
  { id: "audit", label: "Audit Logs", icon: FileText },
];

export function AdminNavTabs({
  activeTab,
  setActiveTab,
  loading,
  onRefresh,
}: AdminNavTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900 border border-white/5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
        <span>Sync Data</span>
      </button>
    </div>
  );
}
