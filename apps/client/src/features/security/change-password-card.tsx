"use client";

import { useState } from "react";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

interface ChangePasswordCardProps {
  apiBase: string;
  getAuthHeaders: () => Record<string, string>;
}

export function ChangePasswordCard({ apiBase, getAuthHeaders }: ChangePasswordCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setPasswordMsg({ type: "success", text: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Error changing password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-semibold text-white">Change Password</h2>
      </div>

      {passwordMsg && (
        <div
          className={`p-3.5 rounded-2xl mb-6 text-sm flex items-center gap-2.5 ${
            passwordMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {passwordMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{passwordMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
