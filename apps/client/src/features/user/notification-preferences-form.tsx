"use client";

import { useState } from "react";
import { Bell, Mail, Volume2, CheckCircle2 } from "lucide-react";
import { updatePreferencesAction } from "../../actions/user.actions";

interface NotificationPreferencesFormProps {
  initialPreferences: {
    emailReminders: boolean;
    emailInvites: boolean;
    pushNewMessages: boolean;
    inAppSounds: boolean;
  };
}

export function NotificationPreferencesForm({ initialPreferences }: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updatePreferencesAction(prefs);
    setLoading(false);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Notification Channels & Alerts</h2>
        {saved && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Preferences saved
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/40 border border-white/5 cursor-pointer">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-sm font-medium text-white">Email Meeting Reminders</div>
              <div className="text-xs text-neutral-400">Receive an email 10 minutes before scheduled meetings.</div>
            </div>
          </div>
          <input type="checkbox" checked={prefs.emailReminders} onChange={() => handleToggle("emailReminders")} className="w-5 h-5 rounded bg-neutral-800 text-indigo-600 focus:ring-indigo-500" />
        </label>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/40 border border-white/5 cursor-pointer">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-sm font-medium text-white">Email Meeting Invitations</div>
              <div className="text-xs text-neutral-400">Get notified when colleagues invite you to a meeting.</div>
            </div>
          </div>
          <input type="checkbox" checked={prefs.emailInvites} onChange={() => handleToggle("emailInvites")} className="w-5 h-5 rounded bg-neutral-800 text-indigo-600 focus:ring-indigo-500" />
        </label>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/40 border border-white/5 cursor-pointer">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-sm font-medium text-white">Push Notifications for Chat</div>
              <div className="text-xs text-neutral-400">Desktop notifications when someone mentions you in chat.</div>
            </div>
          </div>
          <input type="checkbox" checked={prefs.pushNewMessages} onChange={() => handleToggle("pushNewMessages")} className="w-5 h-5 rounded bg-neutral-800 text-indigo-600 focus:ring-indigo-500" />
        </label>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/40 border border-white/5 cursor-pointer">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-sm font-medium text-white">In-App Sound Effects</div>
              <div className="text-xs text-neutral-400">Play audio chime when participants join or leave.</div>
            </div>
          </div>
          <input type="checkbox" checked={prefs.inAppSounds} onChange={() => handleToggle("inAppSounds")} className="w-5 h-5 rounded bg-neutral-800 text-indigo-600 focus:ring-indigo-500" />
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
