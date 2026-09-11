import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "../../../features/auth/login-form-client";
import { SocialLogins } from "../../../features/auth/social-logins";
import { PasskeyButton } from "../../../features/auth/passkey-button";

export const metadata: Metadata = {
  title: "Sign In - Meet Enterprise",
  description: "Sign in to your Meet account to host and join real-time encrypted video conferences.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-neutral-400 text-sm mt-1">Sign in to your Meet account to continue</p>
      </header>

      {/* Passkey Biometric Button */}
      <PasskeyButton onSuccess={() => {}} />

      <div className="relative flex items-center justify-center">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-neutral-900 px-3 text-xs uppercase tracking-wider text-neutral-500 font-medium absolute">
          or password
        </span>
      </div>

      <LoginForm />
      <SocialLogins onSelect={() => {}} />

      <footer className="text-center text-xs text-neutral-400 mt-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
          Sign up
        </Link>
      </footer>
    </div>
  );
}
