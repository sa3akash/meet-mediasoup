"use client";

import { useState } from "react";
import { X, Lock, Unlock, ShieldAlert, AlertTriangle, Disc, MicOff, MonitorOff, MessageSquareOff } from "lucide-react";
import { lockMeetingAction, endMeetingForAllAction, updateMeetingSettingsAction } from "../../actions/meeting-controls.actions";

interface Props {
  meetingId: string;
  initialLocked?: boolean;
  initialSettings?: any;
  isOpen: boolean;
  onClose: () => void;
}

export function HostControlsModal({ meetingId, initialLocked = false, initialSettings, isOpen, onClose }: Props) {
  const [locked, setLocked] = useState(initialLocked);
  const [settings, setSettings] = useState(initialSettings || {});
  const [isEnding, setIsEnding] = useState(false);

  if (!isOpen) return null;

  const handleToggleLock = async () => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    await lockMeetingAction(meetingId, nextLocked);
  };

  const handleToggleSetting = async (key: string) => {
    const nextValue = !settings[key];
    const updated = { ...settings, [key]: nextValue };
    setSettings(updated);
    await updateMeetingSettingsAction(meetingId, { [key]: nextValue });
  };

  const handleEndMeeting = async () => {
    if (!confirm("Are you sure you want to end this meeting for all participants?")) return;
    setIsEnding(true);
    await endMeetingForAllAction(meetingId);
    window.location.href = "/meetings";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Host Controls</h3>
              <p className="text-neutral-400 text-xs">Manage participant permissions & room access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Meeting Button */}
        <div className="p-4 rounded-2xl bg-neutral-800/60 border border-white/5 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-white text-xs font-semibold flex items-center gap-2">
              {locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
              {locked ? "Meeting is Locked" : "Meeting is Unlocked"}
            </h4>
            <p className="text-neutral-400 text-[11px]">{locked ? "No new participants can join this meeting" : "Anyone with access can join freely"}</p>
          </div>
          <button
            onClick={handleToggleLock}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              locked ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {locked ? "Unlock" : "Lock Room"}
          </button>
        </div>

        {/* In-Meeting Permission Toggles */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Participant Privileges</h4>
          {[
            { key: "disableScreenShare", label: "Disable Screen Share", icon: MonitorOff },
            { key: "disableChat", label: "Disable In-Call Chat", icon: MessageSquareOff },
            { key: "muteOnJoin", label: "Mute New Joiners", icon: MicOff },
          ].map((item) => {
            const Icon = item.icon;
            const active = !!settings[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950/40 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-300 text-xs font-medium">{item.label}</span>
                </div>
                <button
                  onClick={() => handleToggleSetting(item.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    active ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {active ? "Disabled" : "Allowed"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Danger Zone: End Meeting For All */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="w-full py-3 px-4 rounded-2xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-semibold text-xs border border-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isEnding ? "Ending Meeting..." : "End Meeting For All"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
