import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminConsole } from "../../../features/admin/admin-console";
import { getAdminOverviewAction } from "../../../actions/admin.actions";
import { DashboardNav } from "../../../components/common/dashboard-nav";
import { getSessionUser } from "../../../lib/session";

export const metadata: Metadata = {
  title: "Enterprise Admin Console | Google Meet SFU",
  description: "Global management for users, meetings, recordings, storage, moderation reports, and audit logs.",
  openGraph: {
    title: "Enterprise Admin Console | Google Meet SFU",
    description: "Global management for users, meetings, recordings, storage, moderation reports, and audit logs.",
  },
};

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { stats } = await getAdminOverviewAction();

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Dashboard Top Header & Global Nav Tabs */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Admin Console</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/30">
              Enterprise
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            Global management for users, meetings, recordings, storage, moderation reports, and audit logs.
          </p>
        </div>

        <DashboardNav currentSection="admin" />
      </header>

      {/* Main Admin Console */}
      <AdminConsole initialOverview={stats} currentUserId={user.id} />
    </main>
  );
}
