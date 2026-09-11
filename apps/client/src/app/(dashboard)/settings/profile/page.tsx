import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ProfileHeader } from "../../../../features/user/profile-header";
import { ProfileDetailsForm } from "../../../../features/user/profile-details-form";

export const metadata: Metadata = {
  title: "Profile Settings - Meet Enterprise",
  description: "Manage your personal profile, avatar, cover banner, and preferences.",
};

export default async function ProfileSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const apiBase = process.env.API_URL || "http://localhost:4000";

  let user = {
    name: "User",
    email: "user@example.com",
    avatarUrl: null as string | null,
    coverUrl: null as string | null,
    bio: "",
    timezone: "UTC",
    language: "en",
    presenceStatus: "ONLINE",
  };

  if (token) {
    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        user = { ...user, ...data.user };
      }
    } catch {}
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white p-6 md:p-12 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage how you appear across meetings and presence status.</p>
        </div>

        <ProfileHeader user={user} />
        <ProfileDetailsForm initialData={user} />
      </div>
    </div>
  );
}
