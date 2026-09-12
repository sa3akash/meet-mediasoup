"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Video,
  Disc,
  HardDrive,
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Clock,
  Activity,
  Layers,
  BarChart3,
  Flame,
  Check,
} from "lucide-react";
import {
  getAdminOverviewAction,
  getAdminUsersAction,
  updateUserRoleAction,
  adminBanUserAction,
  deleteUserAction,
  getAdminMeetingsAction,
  terminateMeetingAction,
  getAdminRecordingsAction,
  deleteAdminRecordingAction,
  getAdminStorageAction,
  getAdminAuditLogsAction,
} from "../../actions/admin.actions";
import {
  getReportsAction,
  updateReportStatusAction,
} from "../../actions/moderation.actions";

type AdminTab = "overview" | "users" | "meetings" | "recordings" | "storage" | "moderation" | "audit";

interface AdminConsoleProps {
  initialOverview?: any;
  currentUserId?: string;
}

export function AdminConsole({ initialOverview, currentUserId }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Overview State
  const [overview, setOverview] = useState<any>(initialOverview);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");

  // Meetings State
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [meetingFilter, setMeetingFilter] = useState<string>("ACTIVE");

  // Recordings State
  const [recordingsList, setRecordingsList] = useState<any[]>([]);

  // Storage State
  const [storageData, setStorageData] = useState<any>(null);

  // Moderation Reports State
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("");

  // Audit Logs State
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Fetch data per tab
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]);

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const res = await getAdminOverviewAction();
        if (res.success) setOverview(res.stats);
      } else if (tab === "users") {
        const res = await getAdminUsersAction({
          search: userSearch || undefined,
          role: userRoleFilter || undefined,
        });
        if (res.success) setUsersList(res.users);
      } else if (tab === "meetings") {
        const res = await getAdminMeetingsAction(meetingFilter || undefined);
        if (res.success) setMeetingsList(res.meetings);
      } else if (tab === "recordings") {
        const res = await getAdminRecordingsAction();
        if (res.success) setRecordingsList(res.recordings);
      } else if (tab === "storage") {
        const res = await getAdminStorageAction();
        if (res.success) setStorageData(res.storage);
      } else if (tab === "moderation") {
        const res = await getReportsAction({ status: reportStatusFilter || undefined });
        if (res.success) setReportsList(res.reports);
      } else if (tab === "audit") {
        const res = await getAdminAuditLogsAction();
        if (res.success) setAuditLogsList(res.logs);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await updateUserRoleAction(userId, newRole, currentUserId);
    if (res.success) {
      showNotice("User role updated successfully");
      loadTabData("users");
    }
  };

  const handleBanToggle = async (userId: string, isCurrentlyBanned: boolean) => {
    const action = isCurrentlyBanned ? "UNBAN" : "BAN";
    const res = await adminBanUserAction(userId, action, currentUserId);
    if (res.success) {
      showNotice(isCurrentlyBanned ? "User unbanned" : "User banned and sessions revoked");
      loadTabData("users");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await deleteUserAction(userId, currentUserId);
    if (res.success) {
      showNotice("User deleted");
      loadTabData("users");
    }
  };

  const handleTerminateMeeting = async (meetingId: string) => {
    if (!confirm("Terminate this meeting room immediately for all participants?")) return;
    const res = await terminateMeetingAction(meetingId, currentUserId, "Terminated by Administrator");
    if (res.success) {
      showNotice("Meeting terminated");
      loadTabData("meetings");
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm("Delete this recording?")) return;
    const res = await deleteAdminRecordingAction(recordingId, currentUserId);
    if (res.success) {
      showNotice("Recording deleted");
      loadTabData("recordings");
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: any) => {
    const res = await updateReportStatusAction(reportId, status, currentUserId);
    if (res.success) {
      showNotice(`Report marked as ${status}`);
      loadTabData("moderation");
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Admin Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900 border border-white/5">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "overview"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "users"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users</span>
        </button>

        <button
          onClick={() => setActiveTab("meetings")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "meetings"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Meetings</span>
        </button>

        <button
          onClick={() => setActiveTab("recordings")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "recordings"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Recordings</span>
        </button>

        <button
          onClick={() => setActiveTab("storage")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "storage"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage</span>
        </button>

        <button
          onClick={() => setActiveTab("moderation")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "moderation"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Moderation</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === "audit"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => loadTabData(activeTab)}
          className="ml-auto p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Refresh current tab"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">{overview?.users?.total ?? 0}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {overview?.users?.banned ?? 0} suspended users
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Active Meetings</span>
                <Video className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2 flex items-center gap-2">
                <span>{overview?.meetings?.activeNow ?? 0}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {overview?.meetings?.total ?? 0} total meetings hosted
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Storage</span>
                <HardDrive className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">
                {formatBytes(overview?.storage?.totalBytes || 0)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {overview?.storage?.totalFiles || 0} media assets in S3 / local
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Cloud Recordings</span>
                <Disc className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">{overview?.recordings?.total ?? 0}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {formatDuration(overview?.recordings?.totalDurationSeconds || 0)} total recorded video
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Pending Reports</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">{overview?.moderation?.pendingReports ?? 0}</div>
              <p className="text-xs text-neutral-500 mt-1">Awaiting moderation review</p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Audit Events</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white mt-2">{overview?.auditLogs?.total ?? 0}</div>
              <p className="text-xs text-neutral-500 mt-1">Immutable security audit trail</p>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
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
      )}

      {/* 2. USERS TAB */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-neutral-900 border border-white/5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadTabData("users")}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-800 border border-white/5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setTimeout(() => loadTabData("users"), 50);
              }}
              className="px-3 py-2 rounded-xl bg-neutral-800 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>

            <button
              onClick={() => loadTabData("users")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              Filter
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-800/60 text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isBanned = Boolean(u.bannedAt);
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-semibold text-white">
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[11px] text-neutral-500">{u.email}</div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-2 py-1 rounded-lg bg-neutral-800 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="USER">USER</option>
                            <option value="MODERATOR">MODERATOR</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>

                        <td className="p-3.5">
                          {isBanned ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold border border-red-500/30">
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                              ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-neutral-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleBanToggle(u.id, isBanned)}
                              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                isBanned
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                              }`}
                              title={isBanned ? "Unban account" : "Ban account & revoke sessions"}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{isBanned ? "Unban" : "Ban"}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MEETINGS TAB */}
      {activeTab === "meetings" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-900 border border-white/5">
            <button
              onClick={() => {
                setMeetingFilter("ACTIVE");
                setTimeout(() => loadTabData("meetings"), 50);
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
                setTimeout(() => loadTabData("meetings"), 50);
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
                            onClick={() => handleTerminateMeeting(m.id)}
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
      )}

      {/* 4. RECORDINGS TAB */}
      {activeTab === "recordings" && (
        <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-800/60 text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Meeting</th>
                <th className="p-3.5">Format & Type</th>
                <th className="p-3.5">File Size</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recordingsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No recordings found
                  </td>
                </tr>
              ) : (
                recordingsList.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{r.meetingTitle || "Meeting Recording"}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">/{r.meetingSlug}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-800 border border-white/10 text-[10px] font-mono">
                        {r.format || "MP4"} ({r.type || "CLOUD"})
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">{formatBytes(r.fileSize)}</td>
                    <td className="p-3.5 font-mono">{formatDuration(r.duration)}</td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                        {r.status || "READY"}
                      </span>
                    </td>

                    <td className="p-3.5 text-neutral-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.fileUrl && (
                          <a
                            href={r.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="Open recording file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteRecording(r.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete recording"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. STORAGE TAB */}
      {activeTab === "storage" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Footprint</span>
              <div className="text-3xl font-bold text-white mt-2">
                {formatBytes(storageData?.totalBytes || 0)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Across all storage backends</p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Recordings Volume</span>
              <div className="text-3xl font-bold text-white mt-2">
                {formatBytes(storageData?.recordings?.totalBytes || 0)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">{storageData?.recordings?.count || 0} recording files</p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Uploaded Attachments</span>
              <div className="text-3xl font-bold text-white mt-2">
                {formatBytes(storageData?.uploads?.totalBytes || 0)}
              </div>
              <p className="text-xs text-neutral-500 mt-1">{storageData?.uploads?.count || 0} shared files</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5 space-y-4">
            <h3 className="text-base font-semibold text-white">S3 & Local Storage Buckets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {storageData?.buckets?.map((b: any) => (
                <div key={b.name} className="p-4 rounded-xl bg-neutral-800/40 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-5 h-5 text-indigo-400" />
                    <div>
                      <div className="text-sm font-semibold text-white font-mono">{b.name}</div>
                      <div className="text-xs text-neutral-400">{b.filesCount} objects</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono font-bold text-white">{formatBytes(b.bytes)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODERATION TAB */}
      {activeTab === "moderation" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-900 border border-white/5">
            <button
              onClick={() => {
                setReportStatusFilter("");
                setTimeout(() => loadTabData("moderation"), 50);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reportStatusFilter === ""
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => {
                setReportStatusFilter("OPEN");
                setTimeout(() => loadTabData("moderation"), 50);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reportStatusFilter === "OPEN"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => {
                setReportStatusFilter("RESOLVED");
                setTimeout(() => loadTabData("moderation"), 50);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reportStatusFilter === "RESOLVED"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-800/60 text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Reason / Evidence</th>
                  <th className="p-3.5">Reporter</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Reported At</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      No moderation reports
                    </td>
                  </tr>
                ) : (
                  reportsList.map((rep) => (
                    <tr key={rep.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                          {rep.category}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-medium text-white truncate" title={rep.reason}>
                          {rep.reason}
                        </div>
                        {rep.reportedUserId && (
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            Target User ID: <span className="font-mono">{rep.reportedUserId}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-white">{rep.reporterName || "Anonymous"}</div>
                        <div className="text-[11px] text-neutral-500">{rep.reporterEmail}</div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            rep.status === "OPEN"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : rep.status === "INVESTIGATING"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-neutral-400">
                        {new Date(rep.createdAt).toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rep.status !== "RESOLVED" && (
                            <button
                              onClick={() => handleUpdateReportStatus(rep.id, "RESOLVED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          {rep.status !== "DISMISSED" && (
                            <button
                              onClick={() => handleUpdateReportStatus(rep.id, "DISMISSED")}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                            >
                              Dismiss
                            </button>
                          )}
                          {rep.reportedUserId && (
                            <button
                              onClick={() => handleBanToggle(rep.reportedUserId, false)}
                              className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-medium text-xs transition-colors"
                            >
                              Ban User
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. AUDIT LOGS TAB */}
      {activeTab === "audit" && (
        <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-xl">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-800/60 text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500">
                    No audit logs recorded
                  </td>
                </tr>
              ) : (
                auditLogsList.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono font-semibold border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-white">{log.actorName || "System"}</div>
                      <div className="text-[11px] text-neutral-500">{log.actorEmail}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-mono text-neutral-300">{log.targetType}</div>
                      <div className="text-[11px] text-neutral-500 font-mono truncate max-w-[150px]">
                        {log.targetId}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <pre className="text-[11px] font-mono text-neutral-400 max-w-xs truncate">
                        {JSON.stringify(log.details || {})}
                      </pre>
                    </td>

                    <td className="p-3.5 text-neutral-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
