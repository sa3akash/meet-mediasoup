"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfileAction } from "../../actions/user.actions";

interface ProfileDetailsFormProps {
  initialData: {
    name: string;
    bio?: string | null;
    timezone: string;
    language: string;
  };
}

export function ProfileDetailsForm({ initialData }: ProfileDetailsFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white">Personal Information</h3>

      {state?.message && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}
      {state?.error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Display Name</label>
          <input
            name="name"
            defaultValue={initialData.name}
            required
            className="bg-neutral-800 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Timezone</label>
          <select
            name="timezone"
            defaultValue={initialData.timezone || "UTC"}
            className="bg-neutral-800 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="UTC">UTC (Universal Time)</option>
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="Europe/London">London (GMT / BST)</option>
            <option value="Europe/Paris">Central European Time</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Dhaka">Dhaka (BST)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Language</label>
          <select
            name="language"
            defaultValue={initialData.language || "en"}
            className="bg-neutral-800 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="en">English (US)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={initialData.bio || ""}
            placeholder="Tell your teammates a bit about yourself..."
            className="bg-neutral-800 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
