"use client";

import { Shield, Disc, MicOff, VideoOff, MonitorOff, MessageSquareOff, FileText, SmilePlus, Lock } from "lucide-react";

interface SettingItem {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  icon: any;
}

const SETTINGS_LIST: SettingItem[] = [
  { name: "waitingRoomEnabled", label: "Waiting Room", description: "Participants need host approval to enter", icon: Shield },
  { name: "autoRecording", label: "Auto Recording", description: "Automatically start recording on meeting start", icon: Disc },
  { name: "muteOnJoin", label: "Mute On Join", description: "Participants enter with microphone muted", defaultChecked: true, icon: MicOff },
  { name: "cameraOffOnJoin", label: "Disable Camera On Join", description: "Participants join with video turned off", icon: VideoOff },
  { name: "disableScreenShare", label: "Disable Screen Share", description: "Restrict screen sharing to host only", icon: MonitorOff },
  { name: "disableChat", label: "Disable Chat", description: "Disallow text messages during meeting", icon: MessageSquareOff },
  { name: "disableFileShare", label: "Disable File Share", description: "Prevent file uploads in the chat", icon: FileText },
  { name: "disableReactions", label: "Disable Reactions", description: "Turn off emoji reactions and applause", icon: SmilePlus },
  { name: "lockMeeting", label: "Lock Meeting", description: "Block new participants from entering room", icon: Lock },
];

export function MeetingSettingsChecklist({ defaultValues }: { defaultValues?: Record<string, boolean> }) {
  return (
    <div className="space-y-2.5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Security & Meeting Controls</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SETTINGS_LIST.map((item) => {
          const Icon = item.icon;
          const isChecked = defaultValues ? (defaultValues[item.name] ?? false) : item.defaultChecked;
          return (
            <label
              key={item.name}
              className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 hover:border-white/10 transition-colors cursor-pointer select-none group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-indigo-500/10 text-neutral-400 group-hover:text-indigo-400 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white text-xs font-semibold">{item.label}</div>
                  <div className="text-neutral-500 text-[11px] leading-tight">{item.description}</div>
                </div>
              </div>
              <input
                type="checkbox"
                name={item.name}
                defaultChecked={isChecked}
                className="w-4 h-4 mt-1 rounded bg-neutral-800 border-white/20 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600 shrink-0"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
