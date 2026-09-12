"use client";

import { useState } from "react";
import { AlertTriangle, Flag, X, CheckCircle2, ShieldAlert } from "lucide-react";
import { submitReportAction } from "../../../actions/moderation.actions";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  meetingId: string;
  targetUser?: { id: string; name: string } | null;
}

export function ReportModal({
  isOpen,
  onClose,
  reporterId,
  meetingId,
  targetUser,
}: ReportModalProps) {
  const [category, setCategory] = useState<"SPAM" | "HARASSMENT" | "INAPPROPRIATE_CONTENT" | "OTHER">("INAPPROPRIATE_CONTENT");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please describe the reason for your report.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await submitReportAction({
      reporterId,
      reportedMeetingId: meetingId,
      reportedUserId: targetUser?.id,
      category,
      reason: reason.trim(),
    });

    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason("");
        onClose();
      }, 1500);
    } else {
      setError(res.error || "Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-white/10 p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Report Submitted</h3>
            <p className="text-sm text-neutral-400 max-w-xs">
              Thank you for helping keep the meeting safe. Our moderation team will review this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl bg-neutral-800/80 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50"
              >
                <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
                <option value="HARASSMENT">Harassment or Bullying</option>
                <option value="SPAM">Spam or Unwanted Ads</option>
                <option value="OTHER">Other Violation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Reason / Details</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Please describe what happened..."
                className="w-full rounded-xl bg-neutral-800/80 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{loading ? "Submitting..." : "Submit Report"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
