import { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarView } from "../../../features/calendar/calendar-view";
import { getCalendarEventsAction } from "../../../actions/calendar.actions";
import { DashboardNav } from "../../../components/common/dashboard-nav";
import { getSessionUser } from "../../../lib/session";

export const metadata: Metadata = {
  title: "Calendar & Schedule | Google Meet SFU",
  description: "View upcoming meetings, recurring cadences, and sync directly with Google or Outlook.",
  openGraph: {
    title: "Calendar & Schedule | Google Meet SFU",
    description: "View upcoming meetings, recurring cadences, and sync directly with Google or Outlook.",
  },
};

export default async function CalendarPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { events } = await getCalendarEventsAction({ userId: user.id });

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Dashboard Top Header & Nav Tabs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Calendar & Schedule</h1>
          <p className="text-neutral-400 text-sm mt-1">
            View your upcoming meetings, recurring cadences, and sync directly with Google or Outlook.
          </p>
        </div>

        <DashboardNav currentSection="calendar" />
      </header>

      {/* Main Calendar Component */}
      <CalendarView initialEvents={events} userId={user.id} />
    </main>
  );
}
