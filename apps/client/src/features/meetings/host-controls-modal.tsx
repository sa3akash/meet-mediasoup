"use client";

import { useState } from "react";
import { X, Lock, Unlock, ShieldAlert, PhoneOff } from "lucide-react";
import {
  lockMeetingAction,
  endMeetingForAllAction,
  updateMeetingSettingsAction,
  updateMeetingPasscodeAction,
} from "../../actions/meeting-controls.actions";
import { HostPasscodeControl } from "./components/host-passcode-control";
import { HostRulesList } from "./components/host-rules-list";

interface Props {
  meetingId: string;
  initialLocked?: boolean;
  initialSettings?: any;
  initialPasscode?: string;
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSettings?: (settings: any) => void;
  onEndMeetingForAll?: () => void;
}

export function HostControlsModal({
  meetingId,
  initialLocked = false,
  initialSettings,
  initialPasscode = "",
  isOpen,
  onClose,
  onBroadcastSettings,
  onEndMeetingForAll,
}: Props) {
  const [locked, setLocked] = useState(initialLocked);
  const [settings, setSettings] = useState(initialSettings || {});
  const [passcode, setPasscode] = useState(initialPasscode || initialSettings?.passcode || "");
  const [isSavingPasscode, setIsSavingPasscode] = useState(false);
  const [passcodeFeedback, setPasscodeFeedback] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  if (!isOpen) return null;

  const handleToggleLock = async () => {
    const nextLocked = !locked;
    setLocked(nextLocked);
    const updatedSettings = { ...settings, lockMeeting: nextLocked };
    setSettings(updatedSettings);
    onBroadcastSettings?.(updatedSettings);
    await lockMeetingAction(meetingId, nextLocked);
  };

  const handleToggleSetting = async (key: string) => {
    const nextValue = !settings[key];
    const updated = { ...settings, [key]: nextValue };
    setSettings(updated);
    onBroadcastSettings?.(updated);
    await updateMeetingSettingsAction(meetingId, { [key]: nextValue });
  };

  const handleSavePasscode = async (newCode: string | null) => {
    setIsSavingPasscode(true);
    setPasscodeFeedback(null);
    try {
      const res = await updateMeetingPasscodeAction(meetingId, newCode);
      if (res.success) {
        setPasscode(newCode || "");
        setPasscodeFeedback(newCode ? "Password set successfully" : "Password removed (Room is Public)");
        setTimeout(() => setPasscodeFeedback(null), 3500);
      } else {
        setPasscodeFeedback("Failed to update password");
      }
    } catch {
      setPasscodeFeedback("Failed to update password");
    } finally {
      setIsSavingPasscode(false);
    }
  };

  const handleGeneratePasscode = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPasscode(randomPin);
  };

  const handleEndMeeting = async () => {
    if (!confirm("Are you sure you want to end this meeting for all participants?")) return;
    setIsEnding(true);
    onEndMeetingForAll?.();
    await endMeetingForAllAction(meetingId);
    window.location.href = "/meetings";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Host Controls & Security</h3>
              <p className="text-neutral-400 text-xs">Live participant permissions & session controls</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Meeting Button */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-white text-xs font-semibold flex items-center gap-2">
              {locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
              {locked ? "Meeting is Locked" : "Meeting is Unlocked"}
            </h4>
            <p className="text-neutral-400 text-[11px] mt-0.5">
              {locked ? "No new participants can join this meeting" : "Anyone with authorization can join freely"}
            </p>
          </div>
          <button
            onClick={handleToggleLock}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              locked
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {locked ? "Unlock Meeting" : "Lock Meeting"}
          </button>
        </div>

        {/* Passcode Section */}
        <HostPasscodeControl
          passcode={passcode}
          setPasscode={setPasscode}
          onGeneratePasscode={handleGeneratePasscode}
          onSavePasscode={handleSavePasscode}
          isSavingPasscode={isSavingPasscode}
          passcodeFeedback={passcodeFeedback}
        />

        {/* In-Meeting Permission Toggles */}
        <HostRulesList settings={settings} onToggleSetting={handleToggleSetting} />

        {/* Danger Zone: End Meeting For All */}
        <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-semibold text-xs border border-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>{isEnding ? "Ending Meeting For Everyone..." : "End Meeting For All"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
