"use client";

import {
  Shield,
  Disc,
  MicOff,
  VideoOff,
  MonitorOff,
  MessageSquareOff,
  FileText,
  SmilePlus,
} from "lucide-react";

export const HOST_SETTING_ITEMS = [
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

interface HostRulesListProps {
  settings: Record<string, boolean>;
  onToggleSetting: (key: string) => void;
}

export function HostRulesList({ settings, onToggleSetting }: HostRulesListProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
        Meeting Rules & Privileges
      </h4>
      <div className="space-y-2">
        {HOST_SETTING_ITEMS.map((item) => {
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
                onClick={() => onToggleSetting(item.key)}
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
  );
}
