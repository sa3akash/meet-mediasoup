"use client";

import {
  X,
  Lock,
  Unlock,
  ShieldAlert,
  AlertTriangle,
  Disc,
  MicOff,
  VideoOff,
  MonitorOff,
  MessageSquareOff,
  FileText,
  SmilePlus,
  Shield,
  PhoneOff,
  KeyRound,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  lockMeetingAction,
  endMeetingForAllAction,
  updateMeetingSettingsAction,
  updateMeetingPasscodeAction,
} from "../../actions/meeting-controls.actions";
import { useState } from "react";

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


  const SETTING_ITEMS = [
    {
      key: "waitingRoomEnabled",
      label: "Waiting Room",
      desc: "New participants must be admitted by host",
      icon: Shield,
      isDanger: false,
    },
    {
      key: "autoRecording",
      label: "Auto Cloud Recording",
      desc: "Record meeting sessions to cloud storage",
      icon: Disc,
      isDanger: false,
    },
    {
      key: "muteOnJoin",
      label: "Mute On Join",
      desc: "Participants enter with microphone muted",
      icon: MicOff,
      isDanger: false,
    },
    {
      key: "cameraOffOnJoin",
      label: "Disable Camera On Join",
      desc: "Participants enter with video camera turned off",
      icon: VideoOff,
      isDanger: false,
    },
    {
      key: "disableScreenShare",
      label: "Disable Screen Share",
      desc: "Restrict screen sharing strictly to hosts",
      icon: MonitorOff,
      isDanger: true,
    },
    {
      key: "disableChat",
      label: "Disable In-Call Chat",
      desc: "Disallow text messages during this meeting",
      icon: MessageSquareOff,
      isDanger: true,
    },
    {
      key: "disableFileShare",
      label: "Disable File Share",
      desc: "Prevent file uploads and document sharing",
      icon: FileText,
      isDanger: true,
    },
    {
      key: "disableReactions",
      label: "Disable Reactions",
      desc: "Turn off animated emoji reactions & applause",
      icon: SmilePlus,
      isDanger: true,
    },
  ];

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

        {/* Meeting Password / Passcode Section */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white text-xs font-semibold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Meeting Password / Passcode
              </h4>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Require participants to enter a PIN or secret password to join
              </p>
            </div>
            {passcode && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                PROTECTED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Set room password / PIN (e.g. 123456)"
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-wider"
              />
            </div>
            <button
              type="button"
              onClick={handleGeneratePasscode}
              title="Generate random PIN"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isSavingPasscode}
              onClick={() => handleSavePasscode(passcode.trim())}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            {passcode && (
              <button
                type="button"
                disabled={isSavingPasscode}
                onClick={() => handleSavePasscode(null)}
                className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs transition-colors"
                title="Remove password"
              >
                Clear
              </button>
            )}
          </div>

          {passcodeFeedback && (
            <p className="text-[11px] text-emerald-400 font-medium animate-in fade-in">
              {passcodeFeedback}
            </p>
          )}
        </div>


        {/* In-Meeting Permission Toggles */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Meeting Rules & Privileges</h4>
          <div className="space-y-2">
            {SETTING_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = !!settings[item.key];
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/40 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-white text-xs font-semibold block">{item.label}</span>
                      <span className="text-neutral-400 text-[11px] leading-tight block">{item.desc}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSetting(item.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      active
                        ? item.isDanger
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {active ? (item.isDanger ? "Disabled" : "Active") : (item.isDanger ? "Allowed" : "Off")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

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
