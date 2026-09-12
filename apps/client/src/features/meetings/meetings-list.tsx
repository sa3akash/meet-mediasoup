"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  Video,
  Calendar,
  Repeat,
  Shield,
  KeyRound,
  Mail,
  Copy,
  Check,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import { cancelMeetingAction } from "../../actions/meeting.actions";

interface MeetingItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  accessLevel: string;
  slug: string;
  scheduledStartAt?: string | null;
  recurrenceRule?: string | null;
  settings?: {
    waitingRoomEnabled?: boolean;
    autoRecording?: boolean;
    muteOnJoin?: boolean;
    lockMeeting?: boolean;
  };
}

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
      {meetings.map((m) => {
        const isCopied = copiedSlug === m.slug;
        const isRecurring = m.type === "RECURRING";
        const isInstant = m.type === "INSTANT";

        return (
          <div
            key={m.id}
            className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isInstant
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : isRecurring
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {m.type}
                    </span>

                    <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/5 flex items-center gap-1">
                      {m.accessLevel === "PRIVATE" && <KeyRound className="w-2.5 h-2.5 text-amber-400" />}
                      {m.accessLevel === "INVITE_ONLY" && <Mail className="w-2.5 h-2.5 text-blue-400" />}
                      {m.accessLevel}
                    </span>

                    {m.settings?.waitingRoomEnabled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Waiting Room
                      </span>
                    )}
                  </div>
                  <h4 className="text-white font-semibold text-base mt-2">{m.title}</h4>
                </div>

                <button
                  onClick={() => handleCancel(m.id)}
                  title="Cancel meeting"
                  className="p-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {m.description && (
                <p className="text-neutral-400 text-xs line-clamp-2">{m.description}</p>
              )}

              <div className="flex items-center gap-4 text-neutral-400 text-xs pt-1">
                {m.scheduledStartAt ? (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{new Date(m.scheduledStartAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Always Available</span>
                  </span>
                )}

                {isRecurring && m.recurrenceRule && (
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{m.recurrenceRule.replace("FREQ=", "")}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(m.slug)}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copied" : m.slug}</span>
                </button>

                {/* Calendar Sync Buttons */}
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/calendar/${m.id}/google-url`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/calendar/${m.id}/google-url`);
                      const data = await res.json();
                      if (data.url) window.open(data.url, "_blank");
                    } catch {
                      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(m.title)}`, "_blank");
                    }
                  }}
                  title="Add to Google Calendar"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-blue-400 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/calendar/${m.id}/ics`}
                  download={`${m.slug}.ics`}
                  title="Export .ICS File (Outlook / Apple / Thunderbird)"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-purple-400 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>

              <Link
                href={`/meeting/${m.slug}`}
                className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25 active:scale-95"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Room</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
