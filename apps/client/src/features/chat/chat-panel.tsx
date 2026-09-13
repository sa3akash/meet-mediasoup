"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Pin, X } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { ImageLightboxModal } from "./image-lightbox-modal";
import { ChatHeader } from "./components/chat-header";
import { ChatMessageItem } from "./components/chat-message-item";
import { ChatInputBar } from "./components/chat-input-bar";
import type { Message, MessageAttachment, MessageReplyTo, MessageLinkPreview } from "./chat-types";

export * from "./chat-types";

interface ChatPanelProps {
  onSendMessage: (content: string, options?: { attachment?: MessageAttachment; replyTo?: MessageReplyTo; mentions?: string[]; linkPreview?: MessageLinkPreview }) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string, isPinned: boolean) => void;
  onMuteUser?: (participantId: string, muted: boolean) => void;
  onExportChat?: (format: "txt" | "json") => void;
  messages: Message[];
  disableChat?: boolean;
  disableFileShare?: boolean;
}

export function ChatPanel({
  onSendMessage,
  onReactMessage,
  onDeleteMessage,
  onPinMessage,
  onExportChat,
  messages,
  disableChat,
  disableFileShare,
}: ChatPanelProps) {
  const { toggleChat, myParticipantId, myRole, isHost, participants, mutedChatUserIds, pinnedMessage } = useMeetingStore();
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageReplyTo | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ file: File; dataUrl: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isPrivileged = isHost || myRole === "HOST" || myRole === "CO_HOST";
  const isMuted = myParticipantId ? mutedChatUserIds.includes(myParticipantId) : false;

  useEffect(() => {
    if (!searchQuery) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, searchQuery]);

  const participantList = useMemo(() => Array.from(participants.entries()).map(([id, p]) => ({ id, name: p.displayName || "Participant" })), [participants]);
  const filteredMentions = useMemo(() => mentionFilter ? participantList.filter((p) => p.name.toLowerCase().includes(mentionFilter.toLowerCase())) : participantList, [participantList, mentionFilter]);
  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content?.toLowerCase().includes(q) || m.senderName?.toLowerCase().includes(q) || m.attachment?.name.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return alert("Maximum file size is 15MB.");
    const reader = new FileReader();
    reader.onload = () => setAttachedFile({ file, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disableChat || isMuted || (!input.trim() && !attachedFile)) return;
    const attachment = attachedFile ? { name: attachedFile.file.name, size: attachedFile.file.size, type: attachedFile.file.type, url: attachedFile.dataUrl } : undefined;
    onSendMessage(input.trim() || (attachedFile ? attachedFile.file.name : ""), { attachment, replyTo: replyingTo || undefined });
    setInput(""); setReplyingTo(null); setAttachedFile(null);
  };

  return (
    <div className="fixed inset-0 md:relative md:inset-auto w-full md:w-80 lg:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-40 md:z-30 animate-in slide-in-from-right duration-200">
      <ChatHeader isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onExportChat={onExportChat} onClose={toggleChat} />

      {pinnedMessage && (
        <div className="px-3 py-2 bg-indigo-950/80 border-b border-indigo-500/30 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-indigo-300 block">Pinned by {pinnedMessage.senderName}</span>
              <span className="text-xs text-white/90 line-clamp-2">{pinnedMessage.content}</span>
            </div>
          </div>
          {isPrivileged && onPinMessage && (
            <button onClick={() => onPinMessage(pinnedMessage.id, false)} className="p-1 text-white/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayedMessages.map((msg) => (
          <ChatMessageItem
            key={msg.id} msg={msg} isPrivileged={isPrivileged} canModerate={isPrivileged || msg.isSelf || false}
            activeReactionMessageId={activeReactionMessageId} setActiveReactionMessageId={setActiveReactionMessageId}
            onReactMessage={onReactMessage} onPinMessage={onPinMessage} onDeleteMessage={onDeleteMessage}
            onSetReply={setReplyingTo} onOpenLightbox={setLightboxImage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInputBar
        input={input} setInput={setInput} replyingTo={replyingTo} setReplyingTo={setReplyingTo}
        attachedFile={attachedFile} setAttachedFile={setAttachedFile} showMentions={showMentions}
        filteredMentions={filteredMentions} onSelectMention={(name) => { setInput((prev) => `${prev}@${name} `); setShowMentions(false); }}
        onSubmit={handleSubmit} onFileSelect={handleFileSelect} disableChat={disableChat} disableFileShare={disableFileShare} isMuted={isMuted}
      />

      <ImageLightboxModal isOpen={Boolean(lightboxImage)} imageUrl={lightboxImage?.url || ""} imageName={lightboxImage?.name || ""} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
