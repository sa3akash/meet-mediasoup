"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Copy, Check, Video, RefreshCw } from "lucide-react";
import { resetPersonalRoomAction } from "../../actions/template.actions";

interface Props {
  slug: string;
  hostName: string;
}

export function PersonalRoomCard({ slug: initialSlug, hostName }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const meetingUrl = typeof window !== "undefined" ? `${window.location.origin}/meeting/${slug}` : `/meeting/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset your Personal Meeting ID? The old link will stop working.")) return;
    setIsResetting(true);
    const res = await resetPersonalRoomAction();
    if (res?.slug) setSlug(res.slug);
    setIsResetting(false);
  };

  return (
    <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group shadow-2xl">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Personal Meeting Room</h3>
            <p className="text-neutral-400 text-xs">{hostName}&apos;s static personal link</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
          Always Ready
        </span>
      </div>

      <div className="bg-neutral-950/70 border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 mb-5">
        <span className="text-neutral-300 text-xs font-mono truncate">{meetingUrl}</span>
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors shrink-0 flex items-center gap-1.5 text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/meeting/${slug}`}
          className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
        >
          <Video className="w-4 h-4" />
          <span>Start Personal Room</span>
        </Link>
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset personal link code"
          className="p-3 rounded-2xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>
    </div>
  );
}
