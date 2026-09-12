import React from "react";
import { HardDrive } from "lucide-react";
import { formatBytes } from "../admin-types";
import { StatCard } from "../../../components/common/stat-card";

interface AdminStorageTabProps {
  storageData: any;
}

export function AdminStorageTab({ storageData }: AdminStorageTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Footprint"
          value={formatBytes(storageData?.totalBytes || 0)}
          icon={<HardDrive className="w-5 h-5 text-indigo-400" />}
          subtitle="Across all storage backends"
        />

        <StatCard
          label="Recordings Volume"
          value={formatBytes(storageData?.recordings?.totalBytes || 0)}
          icon={<HardDrive className="w-5 h-5 text-purple-400" />}
          subtitle={`${storageData?.recordings?.count || 0} recording files`}
        />

        <StatCard
          label="Uploaded Attachments"
          value={formatBytes(storageData?.uploads?.totalBytes || 0)}
          icon={<HardDrive className="w-5 h-5 text-cyan-400" />}
          subtitle={`${storageData?.uploads?.count || 0} shared files`}
        />
      </div>

      <div className="p-6 rounded-2xl bg-neutral-900 border border-white/5 space-y-4">
        <h3 className="text-base font-semibold text-white">S3 & Local Storage Buckets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {storageData?.buckets?.map((b: any) => (
            <div
              key={b.name}
              className="p-4 rounded-xl bg-neutral-800/40 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-sm font-semibold text-white font-mono">{b.name}</div>
                  <div className="text-xs text-neutral-400">{b.filesCount} objects</div>
                </div>
              </div>
              <div className="text-sm font-mono font-bold text-white">
                {formatBytes(b.bytes)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
