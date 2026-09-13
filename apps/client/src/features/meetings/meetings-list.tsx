"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { cancelMeetingAction } from "../../actions/meeting.actions";
import { MeetingListItemCard, MeetingItem } from "./components/meeting-list-item-card";

interface Props {
  meetings: MeetingItem[];
}

export function MeetingsList({ meetings }: Props) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopy = async (slug: string) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/meeting/${slug}` : `/meeting/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    await cancelMeetingAction(id);
  };

  if (meetings.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-white/5 space-y-3">
        <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
        <h3 className="text-neutral-300 font-medium text-sm">No scheduled meetings</h3>
        <p className="text-neutral-500 text-xs max-w-sm mx-auto">
          Plan ahead by scheduling a one-time or recurring video conference with customized room settings.
        </p>
        <Link
          href="/meetings/new"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-semibold pt-2"
        >
          <span>Schedule your first meeting</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {meetings.map((m) => (
        <MeetingListItemCard
          key={m.id}
          meeting={m}
          isCopied={copiedSlug === m.slug}
          onCopy={handleCopy}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
}
