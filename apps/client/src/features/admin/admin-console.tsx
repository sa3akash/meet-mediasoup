"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
  updateUserRoleAction,
  adminBanUserAction,
  deleteUserAction,
  terminateMeetingAction,
  deleteAdminRecordingAction,
} from "../../actions/admin.actions";
import { updateReportStatusAction } from "../../actions/moderation.actions";
import type { AdminTab, AdminConsoleProps } from "./admin-types";
import { fetchAdminTabData } from "./admin-fetch-service";
import { AdminNavTabs } from "./components/admin-nav-tabs";
import { AdminOverviewTab } from "./components/admin-overview-tab";
import { AdminUsersTab } from "./components/admin-users-tab";
import { AdminMeetingsTab } from "./components/admin-meetings-tab";
import { AdminRecordingsTab } from "./components/admin-recordings-tab";
import { AdminStorageTab } from "./components/admin-storage-tab";
import { AdminModerationTab } from "./components/admin-moderation-tab";
import { AdminAuditTab } from "./components/admin-audit-tab";

export function AdminConsole({ initialOverview, currentUserId }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(initialOverview);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [meetingFilter, setMeetingFilter] = useState<string>("ACTIVE");
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [storageData, setStorageData] = useState<any>(null);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("");
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    try {
      const data = await fetchAdminTabData(tab, {
        userSearch,
        userRoleFilter,
        meetingFilter,
        reportStatusFilter,
      });
      if (data.overview) setOverview(data.overview);
      if (data.users) setUsersList(data.users);
      if (data.meetings) setMeetingsList(data.meetings);
      if (data.recordings) setRecordingsList(data.recordings);
      if (data.storage) setStorageData(data.storage);
      if (data.reports) setReportsList(data.reports);
      if (data.logs) setAuditLogsList(data.logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTabData(activeTab); }, [activeTab]);

  const handleRoleChange = async (userId: string, role: any) => {
    const res = await updateUserRoleAction(userId, role);
    if (res.success) { showNotice("User role updated"); loadTabData("users"); }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    const res = await adminBanUserAction(userId, isBanned ? "UNBAN" : "BAN", currentUserId, isBanned ? undefined : "Policy violation");
    if (res.success) { showNotice(isBanned ? "User unbanned" : "User suspended"); loadTabData("users"); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user?")) return;
    const res = await deleteUserAction(userId);
    if (res.success) { showNotice("User removed"); loadTabData("users"); }
  };

  const handleTerminateMeeting = async (meetingId: string) => {
    if (!confirm("Terminate this live meeting?")) return;
    const res = await terminateMeetingAction(meetingId);
    if (res.success) { showNotice("Meeting terminated"); loadTabData("meetings"); }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm("Delete recording?")) return;
    const res = await deleteAdminRecordingAction(recordingId);
    if (res.success) { showNotice("Recording deleted"); loadTabData("recordings"); }
  };

  const handleUpdateReportStatus = async (reportId: string, status: any) => {
    const res = await updateReportStatusAction(reportId, status, currentUserId);
    if (res.success) { showNotice(`Report marked as ${status}`); loadTabData("moderation"); }
  };

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      <AdminNavTabs activeTab={activeTab} setActiveTab={setActiveTab} loading={loading} onRefresh={() => loadTabData(activeTab)} />

      {activeTab === "overview" && <AdminOverviewTab overview={overview} setActiveTab={setActiveTab} />}
      {activeTab === "users" && (
        <AdminUsersTab
          usersList={usersList} userSearch={userSearch} setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter} setUserRoleFilter={setUserRoleFilter}
          onFilter={() => loadTabData("users")} onRoleChange={handleRoleChange}
          onBanToggle={handleBanToggle} onDeleteUser={handleDeleteUser}
        />
      )}
      {activeTab === "meetings" && (
        <AdminMeetingsTab
          meetingsList={meetingsList} meetingFilter={meetingFilter} setMeetingFilter={setMeetingFilter}
          onFilterChange={(f) => { setMeetingFilter(f); loadTabData("meetings"); }}
          onTerminateMeeting={handleTerminateMeeting}
        />
      )}
      {activeTab === "recordings" && <AdminRecordingsTab recordingsList={recordingsList} onDeleteRecording={handleDeleteRecording} />}
      {activeTab === "storage" && <AdminStorageTab storageData={storageData} />}
      {activeTab === "moderation" && (
        <AdminModerationTab
          reportsList={reportsList} reportStatusFilter={reportStatusFilter} setReportStatusFilter={setReportStatusFilter}
          onFilterChange={(s) => { setReportStatusFilter(s); loadTabData("moderation"); }}
          onUpdateReportStatus={handleUpdateReportStatus} onBanUser={(id) => handleBanToggle(id, false)}
        />
      )}
      {activeTab === "audit" && <AdminAuditTab auditLogsList={auditLogsList} />}
    </div>
  );
}
