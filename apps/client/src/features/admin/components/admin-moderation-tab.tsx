import React from "react";

interface AdminModerationTabProps {
  reportsList: any[];
  reportStatusFilter: string;
  setReportStatusFilter: (status: string) => void;
  onFilterChange: (status: string) => void;
  onUpdateReportStatus: (reportId: string, status: any) => void;
  onBanUser: (userId: string) => void;
}

export function AdminModerationTab({
  reportsList,
  reportStatusFilter,
  setReportStatusFilter,
  onFilterChange,
  onUpdateReportStatus,
  onBanUser,
}: AdminModerationTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-900 border border-white/5">
        <button
          onClick={() => {
            setReportStatusFilter("");
            onFilterChange("");
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
            onFilterChange("OPEN");
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
            onFilterChange("RESOLVED");
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
                          onClick={() => onUpdateReportStatus(rep.id, "RESOLVED")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      {rep.status !== "DISMISSED" && (
                        <button
                          onClick={() => onUpdateReportStatus(rep.id, "DISMISSED")}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                        >
                          Dismiss
                        </button>
                      )}
                      {rep.reportedUserId && (
                        <button
                          onClick={() => onBanUser(rep.reportedUserId)}
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
  );
}
