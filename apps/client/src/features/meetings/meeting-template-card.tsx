"use client";

import { useTransition } from "react";
import { Sparkles, Video, Shield, MicOff, Disc, Check } from "lucide-react";
import { instantiateTemplateAction } from "../../actions/template.actions";

interface TemplateProps {
  template: {
    id: string;
    name: string;
    description?: string | null;
    isDefault: boolean;
    settings: {
      waitingRoomEnabled?: boolean;
      autoRecording?: boolean;
      muteOnJoin?: boolean;
      disableChat?: boolean;
    };
  };
}

export function MeetingTemplateCard({ template }: TemplateProps) {
  const [isPending, startTransition] = useTransition();

  const handleLaunch = () => {
    startTransition(async () => {
      await instantiateTemplateAction(template.id);
    });
  };

  return (
    <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between gap-4 group hover:border-indigo-500/40 transition-all shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h4 className="text-white font-semibold text-sm">{template.name}</h4>
          </div>
          {template.isDefault && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Default
            </span>
          )}
        </div>
        <p className="text-neutral-400 text-xs line-clamp-2">{template.description || "Pre-configured meeting environment"}</p>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {template.settings.waitingRoomEnabled && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-white/5 text-neutral-300 border border-white/5">
              <Shield className="w-3 h-3 text-emerald-400" /> Waiting Room
            </span>
          )}
          {template.settings.autoRecording && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-white/5 text-neutral-300 border border-white/5">
              <Disc className="w-3 h-3 text-red-400" /> Auto-Record
            </span>
          )}
          {template.settings.muteOnJoin && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-white/5 text-neutral-300 border border-white/5">
              <MicOff className="w-3 h-3 text-amber-400" /> Mute on Join
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={isPending}
        className="w-full py-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-indigo-600 text-neutral-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-transparent active:scale-95 disabled:opacity-50"
      >
        <Video className="w-3.5 h-3.5" />
        <span>{isPending ? "Starting Meeting..." : "Launch from Template"}</span>
      </button>
    </div>
  );
}
