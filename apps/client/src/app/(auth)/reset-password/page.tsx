import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password - Meet Enterprise",
  description: "Set a new secure password for your account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Set new password</h1>
        <p className="text-neutral-400 text-sm mt-1">Choose a secure password for your account</p>
      </header>

      <Suspense fallback={<div className="text-neutral-400 text-sm text-center py-4">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
