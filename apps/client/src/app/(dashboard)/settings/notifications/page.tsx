import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NotificationPreferencesForm } from "../../../../features/user/notification-preferences-form";

export const metadata: Metadata = {
  title: "Notification Preferences - Meet Enterprise",
  description: "Configure your email, push, and sound notification settings.",
};

export default async function NotificationSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const apiBase = process.env.API_URL || "http://localhost:4000";

  let preferences = {
    emailReminders: true,
    emailInvites: true,
    pushNewMessages: true,
    inAppSounds: true,
  };

  if (token) {
    try {
      const res = await fetch(`${apiBase}/api/users/me/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        preferences = { ...preferences, ...data.preferences };
      }
    } catch {}
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white p-6 md:p-12 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-neutral-400 text-sm mt-1">Control how and when you receive meeting reminders and updates.</p>
        </div>

        <NotificationPreferencesForm initialPreferences={preferences} />
      </div>
    </div>
  );
}
