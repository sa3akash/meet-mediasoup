import { Video } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-3 mb-8 group z-10">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Video className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-white">Meet</span>
      </Link>

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-neutral-900/70 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl z-10">
        {children}
      </div>

      <div className="mt-8 text-neutral-500 text-xs z-10">
        Protected by Meet Enterprise Security & WebAuthn
      </div>
    </div>
  );
}
