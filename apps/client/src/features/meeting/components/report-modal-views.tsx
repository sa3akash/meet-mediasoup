"use client";

import { CheckCircle2, ShieldAlert } from "lucide-react";

interface ReportSuccessProps {
  onClose?: () => void;
}

export function ReportSuccess({ onClose }: ReportSuccessProps) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-white">Report Submitted</h3>
      <p className="text-sm text-neutral-400 max-w-xs">
        Thank you for helping keep the meeting safe. Our moderation team will review this report.
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-xl transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}

export function ReportHeader({ targetUser }: { targetUser?: { id: string; name: string } | null }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-white">
          {targetUser ? `Report ${targetUser.name}` : "Report Meeting"}
        </h3>
        <p className="text-xs text-neutral-400">
          Submit an abuse or conduct violation to moderators.
        </p>
      </div>
    </div>
  );
}
