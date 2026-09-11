"use client";

interface SocialLoginsProps {
  onSelect: (provider: "google" | "github" | "microsoft") => void;
}

export function SocialLogins({ onSelect }: SocialLoginsProps) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-white/10 w-full" />
        <span className="bg-neutral-900 px-3 text-xs uppercase tracking-wider text-neutral-500 font-medium absolute">
          social sign-in
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => onSelect("google")}
          className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-white/10 text-xs font-medium text-white transition-colors flex items-center justify-center gap-1.5"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => onSelect("github")}
          className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-white/10 text-xs font-medium text-white transition-colors flex items-center justify-center gap-1.5"
        >
          GitHub
        </button>
        <button
          type="button"
          onClick={() => onSelect("microsoft")}
          className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-white/10 text-xs font-medium text-white transition-colors flex items-center justify-center gap-1.5"
        >
          Microsoft
        </button>
      </div>
    </div>
  );
}
