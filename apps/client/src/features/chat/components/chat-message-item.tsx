import React from "react";
import {
  Pin,
  Smile,
  Reply,
  Trash2,
  ExternalLink,
  Download,
  Image as ImageIcon,
  FileArchive,
  FileText,
  File as GenericFile,
} from "lucide-react";
import type { Message, MessageReplyTo } from "../chat-types";

interface ChatMessageItemProps {
  msg: Message;
  isPrivileged: boolean;
  canModerate: boolean;
  activeReactionMessageId: string | null;
  setActiveReactionMessageId: (id: string | null) => void;
  onReactMessage?: (id: string, emoji: string) => void;
  onPinMessage?: (id: string, pinned: boolean) => void;
  onDeleteMessage?: (id: string) => void;
  onSetReply: (reply: MessageReplyTo) => void;
  onOpenLightbox: (data: { url: string; name: string }) => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

export function ChatMessageItem({
  msg,
  isPrivileged,
  canModerate,
  activeReactionMessageId,
  setActiveReactionMessageId,
  onReactMessage,
  onPinMessage,
  onDeleteMessage,
  onSetReply,
  onOpenLightbox,
}: ChatMessageItemProps) {
  const isImage = msg.attachment?.type.startsWith("image/");

  return (
    <div className={`group relative flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
        <span className="font-semibold text-white/80">{msg.senderName}</span>
        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        {msg.isPinned && (
          <span className="flex items-center gap-0.5 text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
            <Pin className="w-2.5 h-2.5" /> Pinned
          </span>
        )}
      </div>

      {/* Action menu */}
      <div className={`absolute -top-3 z-20 flex md:opacity-0 md:group-hover:opacity-100 transition-opacity items-center gap-1 bg-neutral-800/95 border border-white/10 rounded-full px-2 py-1 shadow-lg ${msg.isSelf ? "right-2" : "left-2"}`}>
        <div className="relative">
          <button onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)} className="p-1 text-white/60 hover:text-yellow-400">
            <Smile className="w-3.5 h-3.5" />
          </button>
          {activeReactionMessageId === msg.id && (
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 rounded-full p-1.5 flex gap-1 z-30">
              {QUICK_REACTIONS.map((emoji) => (
                <button key={emoji} onClick={() => { onReactMessage?.(msg.id, emoji); setActiveReactionMessageId(null); }} className="p-1 hover:scale-125 text-sm">
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onSetReply({ id: msg.id, senderName: msg.senderName, content: msg.content || "Attachment" })} className="p-1 text-white/60 hover:text-white">
          <Reply className="w-3.5 h-3.5" />
        </button>
        {isPrivileged && onPinMessage && (
          <button onClick={() => onPinMessage(msg.id, !msg.isPinned)} className={`p-1 ${msg.isPinned ? "text-indigo-400" : "text-white/60 hover:text-white"}`}>
            <Pin className="w-3.5 h-3.5" />
          </button>
        )}
        {canModerate && onDeleteMessage && (
          <button onClick={() => onDeleteMessage(msg.id)} className="p-1 text-white/60 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bubble */}
      <div className={`p-3 rounded-2xl text-sm max-w-[85%] break-words flex flex-col gap-2 ${msg.isSelf ? "bg-indigo-600 text-white rounded-br-none" : "bg-neutral-800 text-white/90 rounded-bl-none"}`}>
        {msg.replyTo && (
          <div className="p-2 rounded-xl text-xs bg-black/20 border border-white/10 flex items-start gap-1.5">
            <Reply className="w-3 h-3 text-indigo-400 shrink-0 rotate-180 mt-0.5" />
            <div className="truncate">
              <span className="font-semibold block">{msg.replyTo.senderName}</span>
              <span className="line-clamp-1 opacity-75">{msg.replyTo.content}</span>
            </div>
          </div>
        )}

        {msg.content && <div className="leading-relaxed">{msg.content}</div>}

        {msg.attachment && (
          isImage ? (
            <div className="cursor-pointer overflow-hidden rounded-xl" onClick={() => onOpenLightbox({ url: msg.attachment!.url, name: msg.attachment!.name })}>
              <img src={msg.attachment.url} alt={msg.attachment.name} className="max-h-48 rounded-xl object-cover hover:opacity-90" />
            </div>
          ) : (
            <a href={msg.attachment.url} download={msg.attachment.name} className="flex items-center gap-2 p-2 rounded-xl bg-black/20 hover:bg-black/30 text-xs">
              <GenericFile className="w-4 h-4 text-indigo-400" />
              <span className="truncate flex-1">{msg.attachment.name}</span>
              <Download className="w-3.5 h-3.5" />
            </a>
          )
        )}

        {msg.linkPreview && (
          <a href={msg.linkPreview.url} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-black/30 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-semibold">{msg.linkPreview.title}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        )}

        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-white/10">
            {Object.entries(msg.reactions).map(([emoji, users]) => {
              if (!users || users.length === 0) return null;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReactMessage?.(msg.id, emoji)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-black/25 hover:bg-black/40 border border-white/10 text-white/90 hover:scale-105 transition-all"
                  title={`${users.length} reaction${users.length > 1 ? "s" : ""}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-bold text-white/75">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
