"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { resetPasswordAction } from "@/actions/password.actions";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  const [showPassword, setShowPassword] = useState(false);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Password reset complete</h2>
        <p className="text-neutral-400 text-sm">
          Your password has been changed and all past sessions were revoked. Please log in with your new password.
        </p>
        <Link
          href="/login"
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 mt-4 text-center"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      {state?.error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">New Password</label>
          <div className="relative">
            <input
              name="newPassword"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl pl-4 pr-11 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Confirm New Password</label>
          <input
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {pending ? "Updating..." : <>Reset Password <Lock className="w-4 h-4" /></>}
        </button>
      </form>
    </>
  );
}
