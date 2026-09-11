import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

interface Props {
  meetings: Array<{
    id: string;
    title: string;
    type: string;
    slug: string;
  }>;
}

export function MeetingsList({ meetings }: Props) {
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
        <div key={m.id} className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-white font-semibold text-sm">{m.title}</h4>
            <p className="text-neutral-400 text-xs mt-0.5">{m.type} • Code: {m.slug}</p>
          </div>
          <Link
            href={`/meeting/${m.slug}`}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            Join
          </Link>
        </div>
      ))}
    </div>
  );
}
