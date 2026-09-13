import React from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { formatBytes, formatDuration } from "../admin-types";

interface AdminRecordingsTabProps {
  recordingsList: any[];
  onDeleteRecording: (recordingId: string) => void;
}

export function AdminRecordingsTab({
  recordingsList,
  onDeleteRecording,
}: AdminRecordingsTabProps) {
  return (
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
                      onClick={() => onDeleteRecording(r.id)}
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
  );
}
