import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Video, Calendar as CalendarIcon, BarChart3, ShieldCheck } from "lucide-react";
import { AnalyticsDashboard } from "../../../features/analytics/analytics-dashboard";
import { getAnalyticsOverviewAction } from "../../../actions/analytics.actions";

const API_BASE = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return data.user || null;
    }
  } catch {}
  return null;
}

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { overview } = await getAnalyticsOverviewAction();

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Dashboard Top Header & Nav Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Metrics & Analytics</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Monitor meeting duration, participants, client devices, browsers, WebRTC media quality, and cloud storage.
          </p>
        </div>

        {/* Global Nav Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-neutral-900 border border-white/5">
          <Link
            href="/meetings"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Meetings</span>
          </Link>
          <Link
            href="/calendar"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </Link>
          <Link
            href="/analytics"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* Main Analytics Component */}
      <AnalyticsDashboard overview={overview} userId={user.id} />
    </div>
  );
}
