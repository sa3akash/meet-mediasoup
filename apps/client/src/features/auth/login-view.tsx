"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "./login-form-client";
import { SocialLogins } from "./social-logins";
import { PasskeyButton } from "./passkey-button";

export function LoginView() {
  const router = useRouter();

  const handlePasskeySuccess = (data: any) => {
    if (data?.token) {
      localStorage.setItem("meet_access_token", data.token);
    }
    router.push("/meetings");
  };

  const handleSocialSelect = (provider: "google" | "github" | "microsoft") => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    window.location.href = `${apiBase}/api/auth/oauth/${provider}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
        <p className="text-neutral-400 text-sm mt-1">Sign in to your Meet account to continue</p>
      </header>

      {/* Passkey Biometric Button */}
      <PasskeyButton onSuccess={handlePasskeySuccess} />

      <div className="relative flex items-center justify-center">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-neutral-900 px-3 text-xs uppercase tracking-wider text-neutral-500 font-medium absolute">
          or password
        </span>
      </div>

      <LoginForm />
      <SocialLogins onSelect={handleSocialSelect} />

      <footer className="text-center text-xs text-neutral-400 mt-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
          Sign up
        </Link>
      </footer>
    </div>
  );
}
