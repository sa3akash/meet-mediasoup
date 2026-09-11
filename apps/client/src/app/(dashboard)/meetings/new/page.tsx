import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { ScheduleMeetingForm } from "../../../../features/meetings/schedule-meeting-form";

export const metadata: Metadata = {
  title: "Schedule a Meeting | Google Meet",
  description: "Schedule one-time or recurring video conferences with custom waiting room, access levels, and security controls.",
};

export default function NewMeetingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/meetings"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-medium transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meetings</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Schedule a Meeting</h1>
            <p className="text-neutral-400 text-xs">Set up a one-time or recurring session with custom security settings.</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <ScheduleMeetingForm />
      </div>
    </div>
  );
}
