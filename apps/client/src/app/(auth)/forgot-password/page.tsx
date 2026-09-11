import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Meet Enterprise",
  description: "Reset your Meet password securely.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Forgot password?</h1>
        <p className="text-neutral-400 text-sm mt-1">No worries, we&apos;ll send you a link to reset it.</p>
      </header>

      <ForgotPasswordForm />
    </div>
  );
}
