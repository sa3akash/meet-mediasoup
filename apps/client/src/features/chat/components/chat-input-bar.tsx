import React, { useRef } from "react";
import { Send, Paperclip, X, ShieldAlert } from "lucide-react";
import type { MessageReplyTo } from "../chat-types";

interface ChatInputBarProps {
  input: string;
  setInput: (val: string) => void;
  replyingTo: MessageReplyTo | null;
  setReplyingTo: (reply: MessageReplyTo | null) => void;
  attachedFile: { file: File; dataUrl: string } | null;
  setAttachedFile: (f: { file: File; dataUrl: string } | null) => void;
  showMentions: boolean;
  filteredMentions: Array<{ id: string; name: string }>;
  onSelectMention: (name: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disableChat?: boolean;
  disableFileShare?: boolean;
  isMuted?: boolean;
}

export function ChatInputBar({
  input,
  setInput,
  replyingTo,
  setReplyingTo,
  attachedFile,
  setAttachedFile,
  showMentions,
  filteredMentions,
  onSelectMention,
  onSubmit,
  onFileSelect,
  disableChat,
  disableFileShare,
  isMuted,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (disableChat || isMuted) {
    return (
      <div className="p-4 border-t border-white/10 bg-neutral-950/60 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        {isMuted ? "You are muted in chat by the host." : "Chat is disabled by the host."}
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 bg-neutral-900/80">
      {replyingTo && (
        <div className="px-4 py-2 bg-neutral-800 flex items-center justify-between gap-2 border-b border-white/5">
          <span className="text-xs text-neutral-300 truncate">
            Replying to <strong className="text-white">{replyingTo.senderName}</strong>: {replyingTo.content}
          </span>
          <button onClick={() => setReplyingTo(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showMentions && filteredMentions.length > 0 && (
        <div className="px-2 py-1.5 max-h-36 overflow-y-auto space-y-1 border-b border-white/5 bg-neutral-850">
          {filteredMentions.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectMention(p.name)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-white flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="p-3 flex flex-col gap-2">
        {attachedFile && (
          <div className="px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-xs text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-medium">{attachedFile.file.name}</span>
            </div>
            <button onClick={() => setAttachedFile(null)} className="text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
          <button
            type="button"
            disabled={disableFileShare}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message (@ to mention)"
            className="flex-1 bg-neutral-800 border border-white/10 rounded-full px-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() && !attachedFile}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white shadow-md transition-transform active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
