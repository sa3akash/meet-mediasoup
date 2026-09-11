import type { Metadata } from "next";
import Link from "next/link";
import { SignupFormClient } from "../../../features/auth/signup-form-client";

export const metadata: Metadata = {
  title: "Create Account - Meet Enterprise",
  description: "Sign up for Meet Enterprise to host encrypted, ultra-low latency WebRTC meetings.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
        <p className="text-neutral-400 text-sm mt-1">Start hosting ultra-low latency video meetings</p>
      </header>

      <SignupFormClient />

      <footer className="text-center text-xs text-neutral-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
          Sign in
        </Link>
      </footer>
    </div>
  );
}
