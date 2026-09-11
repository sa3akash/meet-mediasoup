"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { forgotPasswordAction } from "@/actions/password.actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Reset link sent</h2>
        <p className="text-neutral-400 text-sm">
          If an account matches <span className="text-white font-medium">{state.email}</span>, you will receive an email shortly.
        </p>
        <Link
          href="/login"
          className="w-full py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm border border-white/10 mt-4 transition-colors text-center"
        >
          Back to Sign In
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
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Email Address</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {pending ? "Sending link..." : <>Send Reset Link <KeyRound className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </>
  );
}
