import {
  getAdminOverviewAction,
  getAdminUsersAction,
  getAdminAuditLogsAction,
} from "../../actions/admin.actions";
import {
  getAdminMeetingsAction,
  getAdminRecordingsAction,
  getAdminStorageAction,
} from "../../actions/admin-meetings.actions";
import { getReportsAction } from "../../actions/moderation.actions";
import type { AdminTab } from "./admin-types";

export async function fetchAdminTabData(
  tab: AdminTab,
  params: {
    userSearch?: string;
    userRoleFilter?: string;
    meetingFilter?: string;
    reportStatusFilter?: string;
  }
) {
  if (tab === "overview") {
    const res = await getAdminOverviewAction();
    return { overview: res.success ? res.stats : null };
  }
  if (tab === "users") {
    const res = await getAdminUsersAction({
      search: params.userSearch || undefined,
      role: params.userRoleFilter || undefined,
    });
    return { users: res.success ? res.users : [] };
  }
  if (tab === "meetings") {
    const res = await getAdminMeetingsAction(params.meetingFilter || undefined);
    return { meetings: res.success ? res.meetings : [] };
  }
  if (tab === "recordings") {
    const res = await getAdminRecordingsAction();
    return { recordings: res.success ? res.recordings : [] };
  }
  if (tab === "storage") {
    const res = await getAdminStorageAction();
    return { storage: res.success ? res.storage : null };
  }
  if (tab === "moderation") {
    const res = await getReportsAction({ status: params.reportStatusFilter || undefined });
    return { reports: res.success ? res.reports : [] };
  }
  if (tab === "audit") {
    const res = await getAdminAuditLogsAction();
    return { logs: res.success ? res.logs : [] };
  }
  return {};
}
