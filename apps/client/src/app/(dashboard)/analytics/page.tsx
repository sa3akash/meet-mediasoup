import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "../../../features/analytics/analytics-dashboard";
import { getAnalyticsOverviewAction } from "../../../actions/analytics.actions";
import { DashboardNav } from "../../../components/common/dashboard-nav";
import { getSessionUser } from "../../../lib/session";

export const metadata: Metadata = {
  title: "Metrics & Telemetry Analytics | Google Meet SFU",
  description: "Monitor meeting duration, participants, client devices, browsers, WebRTC media quality, and cloud storage.",
  openGraph: {
    title: "Metrics & Telemetry Analytics | Google Meet SFU",
    description: "Monitor meeting duration, participants, client devices, browsers, WebRTC media quality, and cloud storage.",
  },
};

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { overview } = await getAnalyticsOverviewAction();

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Dashboard Top Header & Nav Tabs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Metrics & Analytics</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Monitor meeting duration, participants, client devices, browsers, WebRTC media quality, and cloud storage.
          </p>
        </div>

        <DashboardNav currentSection="analytics" />
      </header>

      {/* Main Analytics Component */}
      <AnalyticsDashboard overview={overview} userId={user.id} />
    </main>
  );
}
