import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Email - Meet Enterprise",
  description: "Verify your email address to activate your Meet account.",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const apiBase = process.env.API_URL || "http://localhost:4000";

  let success = false;
  let error: string | null = null;

  if (token) {
    try {
      const res = await fetch(`${apiBase}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) error = data.error || "Verification failed";
      else success = true;
    } catch {
      error = "Verification service unreachable";
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
        <p className="text-neutral-400 text-sm">
          Your account is now activated. You can sign in and start hosting meetings.
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
        <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
        <p className="text-red-400 text-sm">{error}</p>
        <Link
          href="/login"
          className="w-full py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all border border-white/10 mt-4 text-center"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
      <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
        <MailCheck className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
      <p className="text-neutral-400 text-sm leading-relaxed">
        We sent a verification link to <span className="text-white font-medium">{email || "your email"}</span>.
        Click the link inside to activate your account.
      </p>

      <div className="w-full border-t border-white/10 pt-4 mt-2">
        <Link href="/login" className="text-xs text-neutral-400 hover:text-white transition-colors">
          Already verified? Sign in
        </Link>
      </div>
    </div>
  );
}
