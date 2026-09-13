import React from "react";

interface AdminAuditTabProps {
  auditLogsList: any[];
}

export function AdminAuditTab({ auditLogsList }: AdminAuditTabProps) {
  return (
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
  );
}
