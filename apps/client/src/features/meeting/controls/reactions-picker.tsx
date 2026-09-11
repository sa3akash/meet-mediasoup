"use client";

import { useState } from "react";
import { Smile } from "lucide-react";

interface ReactionsPickerProps {
  onSelectEmoji?: (emoji: string) => void;
}

export function ReactionsPicker({ onSelectEmoji }: ReactionsPickerProps) {
  const [open, setOpen] = useState(false);
  const emojis = ["❤️", "👍", "🎉", "👏", "😂", "😮"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 transition-all duration-200 shadow-md"
        title="Send reaction"
      >
        <Smile className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-neutral-800/95 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 flex items-center gap-2 shadow-2xl animate-in fade-in zoom-in-90">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelectEmoji?.(emoji);
                setOpen(false);
              }}
              className="text-2xl hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
