import React from "react";
import { X, Search, DownloadCloud, FileText, FileCode } from "lucide-react";

interface ChatHeaderProps {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onExportChat?: (format: "txt" | "json") => void;
  onClose: () => void;
}

export function ChatHeader({
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  onExportChat,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-white/10 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">In-call messages</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery("");
            }}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors ${
              isSearchOpen ? "text-indigo-400 bg-white/5" : ""
            }`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {onExportChat && (
            <div className="relative group">
              <button
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Export transcript"
              >
                <DownloadCloud className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col w-32 bg-neutral-800 border border-white/10 rounded-xl p-1 shadow-2xl z-30">
                <button
                  onClick={() => onExportChat("txt")}
                  className="px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg text-left flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" /> Text (.txt)
                </button>
                <button
                  onClick={() => onExportChat("json")}
                  className="px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg text-left flex items-center gap-2"
                >
                  <FileCode className="w-3.5 h-3.5" /> JSON (.json)
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="relative animate-in fade-in duration-150">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in conversation..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-800 border border-white/5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
