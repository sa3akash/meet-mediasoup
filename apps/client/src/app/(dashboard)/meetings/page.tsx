import { Metadata } from "next";
import Link from "next/link";
import { Video, CalendarPlus } from "lucide-react";
import { createInstantMeetingAction } from "../../../actions/meeting.actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PersonalRoomCard } from "../../../features/meetings/personal-room-card";
import { MeetingTemplateCard } from "../../../features/meetings/meeting-template-card";
import { CreateTemplateModal } from "../../../features/meetings/create-template-modal";
import { MeetingsList } from "../../../features/meetings/meetings-list";

export const metadata: Metadata = {
  title: "Meetings & Schedules | Google Meet",
  description: "Schedule, manage, and start instant video meetings and recurring sessions.",
};

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getMeetingsData(userId: string) {
  try {
    const [meetingsRes, pmrRes, templatesRes] = await Promise.all([
      fetch(`${API_BASE}/api/meetings/user/${userId}`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/meetings/pmr/${userId}`, { cache: "no-store" }),
      fetch(`${API_BASE}/api/meetings/templates/${userId}`, { cache: "no-store" }),
    ]);

    const meetingsData = meetingsRes.ok ? await meetingsRes.json() : { meetings: [] };
    const pmrData = pmrRes.ok ? await pmrRes.json() : { personalRoom: { slug: "pmr-shakil" } };
    const templatesData = templatesRes.ok ? await templatesRes.json() : { templates: [] };

    return {
      meetings: meetingsData.meetings || [],
      personalRoom: pmrData.personalRoom || { slug: "pmr-shakil" },
      templates: templatesData.templates?.length ? templatesData.templates : [
        {
          id: "tpl-1",
          name: "All-Hands Webinar",
          description: "Mute on join, auto cloud recording enabled, chat restricted.",
          isDefault: true,
          settings: { waitingRoomEnabled: true, autoRecording: true, muteOnJoin: true, disableChat: false },
        },
        {
          id: "tpl-2",
          name: "Interactive Workshop",
          description: "Open chat, reactions allowed, waiting room disabled for fast entry.",
          isDefault: false,
          settings: { waitingRoomEnabled: false, autoRecording: false, muteOnJoin: false, disableChat: false },
        },
        {
          id: "tpl-3",
          name: "Confidential Board Sync",
          description: "Waiting room on, screen & file share restricted to host.",
          isDefault: false,
          settings: { waitingRoomEnabled: true, autoRecording: true, muteOnJoin: true, disableScreenShare: true, disableFileShare: true },
        },
        {
          id: "tpl-4",
          name: "Quick 1-on-1 Sync",
          description: "Lightweight, open interaction for personal office hours.",
          isDefault: false,
          settings: { waitingRoomEnabled: false, autoRecording: false, muteOnJoin: false, disableChat: false },
        },
      ],
    };
  } catch {
    return {
      meetings: [],
      personalRoom: { slug: "pmr-shakil" },
      templates: [
        {
          id: "tpl-1",
          name: "All-Hands Webinar",
          description: "Mute on join, auto cloud recording enabled, chat restricted.",
          isDefault: true,
          settings: { waitingRoomEnabled: true, autoRecording: true, muteOnJoin: true, disableChat: false },
        },
        {
          id: "tpl-2",
          name: "Interactive Workshop",
          description: "Open chat, reactions allowed, waiting room disabled for fast entry.",
          isDefault: false,
          settings: { waitingRoomEnabled: false, autoRecording: false, muteOnJoin: false, disableChat: false },
        },
        {
          id: "tpl-3",
          name: "Confidential Board Sync",
          description: "Waiting room on, screen & file share restricted to host.",
          isDefault: false,
          settings: { waitingRoomEnabled: true, autoRecording: true, muteOnJoin: true, disableScreenShare: true, disableFileShare: true },
        },
        {
          id: "tpl-4",
          name: "Quick 1-on-1 Sync",
          description: "Lightweight, open interaction for personal office hours.",
          isDefault: false,
          settings: { waitingRoomEnabled: false, autoRecording: false, muteOnJoin: false, disableChat: false },
        },
      ],
    };
  }
}

export default async function MeetingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) {
    redirect("/login");
  }

  let user: any = null;
  try {
    const userRes = await fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (userRes.ok) {
      const data = await userRes.json();
      user = data.user;
    }
  } catch {}

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const { meetings, personalRoom, templates } = await getMeetingsData(userId);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Meetings & Scheduling</h1>
          <p className="text-neutral-400 text-sm mt-1">Start instant rooms, schedule recurring events, or use reusable templates.</p>
        </div>

        <div className="flex items-center gap-3">
          <form action={async () => {
            "use server";
            await createInstantMeetingAction(userId);
          }}>
            <button
              type="submit"
              className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Instant Meeting</span>
            </button>
          </form>

          <Link
            href="/meetings/new"
            className="py-3 px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm flex items-center gap-2 transition-all border border-white/10 active:scale-95"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PersonalRoomCard slug={personalRoom.slug} hostName={user.name} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Quick Start from Template</h2>
              <span className="text-neutral-500 text-xs">{templates.length} templates available</span>
            </div>
            <CreateTemplateModal />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((tpl: any) => (
              <MeetingTemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Upcoming & Scheduled Sessions</h2>
          <span className="text-neutral-500 text-xs">{meetings.length} meetings scheduled</span>
        </div>
        <MeetingsList meetings={meetings} />
      </div>
    </div>
  );
}
