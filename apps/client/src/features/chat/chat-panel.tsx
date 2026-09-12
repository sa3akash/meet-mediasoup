"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  FileArchive,
  File as GenericFile,
  Smile,
  Reply,
  Pin,
  Trash2,
  Search,
  ExternalLink,
  ShieldAlert,
  DownloadCloud,
  FileCode,
} from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import { ImageLightboxModal } from "./image-lightbox-modal";

export interface MessageAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface MessageReplyTo {
  id: string;
  senderName: string;
  content: string;
}

export interface MessageLinkPreview {
  url: string;
  title: string;
  domain: string;
}

export interface Message {
  id: string;
  meetingId?: string;
  senderId?: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
  messageType?: "TEXT" | "FILE" | "SYSTEM";
  attachment?: MessageAttachment;
  replyTo?: MessageReplyTo;
  mentions?: string[];
  linkPreview?: MessageLinkPreview;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  isDeleted?: boolean;
}

interface ChatPanelProps {
  onSendMessage: (
    content: string,
    options?: {
      attachment?: MessageAttachment;
      replyTo?: MessageReplyTo;
      mentions?: string[];
      linkPreview?: MessageLinkPreview;
    }
  ) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onPinMessage?: (messageId: string, isPinned: boolean) => void;
  onMuteUser?: (participantId: string, muted: boolean) => void;
  onExportChat?: (format: "txt" | "json") => void;
  messages: Message[];
  disableChat?: boolean;
  disableFileShare?: boolean;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("compressed"))
    return FileArchive;
  if (type.includes("pdf") || type.includes("text") || type.includes("document") || type.includes("word"))
    return FileText;
  return GenericFile;
}

export function ChatPanel({
  onSendMessage,
  onReactMessage,
  onDeleteMessage,
  onPinMessage,
  onMuteUser,
  onExportChat,
  messages,
  disableChat,
  disableFileShare,
}: ChatPanelProps) {
  const {
    toggleChat,
    myParticipantId,
    myRole,
    isHost,
    participants,
    mutedChatUserIds,
    pinnedMessage,
  } = useMeetingStore();

  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageReplyTo | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    dataUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isPrivileged = isHost || myRole === "HOST" || myRole === "CO_HOST";
  const isMuted = myParticipantId ? mutedChatUserIds.includes(myParticipantId) : false;

  // Auto-scroll on new messages
  useEffect(() => {
    if (!searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, searchQuery]);

  // Participants list for mentions autocomplete
  const participantList = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    participants.forEach((p, id) => {
      list.push({ id, name: p.displayName || "Participant" });
    });
    return list;
  }, [participants]);

  const filteredMentions = useMemo(() => {
    if (!mentionFilter) return participantList;
    return participantList.filter((p) =>
      p.name.toLowerCase().includes(mentionFilter.toLowerCase())
    );
  }, [participantList, mentionFilter]);

  // Filtered messages for search
  const displayedMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase().trim();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        m.senderName?.toLowerCase().includes(q) ||
        m.attachment?.name.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    // Check for mention trigger (@)
    const lastWord = val.split(/\s+/).pop() || "";
    if (lastWord.startsWith("@")) {
      setShowMentions(true);
      setMentionFilter(lastWord.slice(1));
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (name: string) => {
    const words = input.split(/\s+/);
    words.pop(); // remove incomplete mention
    words.push(`@${name} `);
    setInput(words.join(" "));
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large. Maximum file size is 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        file,
        dataUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disableChat || isMuted) return;
    if (!input.trim() && !attachedFile) return;

    const attachment: MessageAttachment | undefined = attachedFile
      ? {
          name: attachedFile.file.name,
          size: attachedFile.file.size,
          type: attachedFile.file.type,
          url: attachedFile.dataUrl,
        }
      : undefined;

    // Detect link in message
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatch = input.match(urlRegex);
    let linkPreview: MessageLinkPreview | undefined = undefined;
    if (urlMatch && urlMatch[0]) {
      try {
        const u = new URL(urlMatch[0]);
        linkPreview = {
          url: urlMatch[0],
          title: u.hostname,
          domain: u.hostname.replace(/^www\./, ""),
        };
      } catch {}
    }

    onSendMessage(input.trim() || (attachedFile ? attachedFile.file.name : ""), {
      attachment,
      replyTo: replyingTo || undefined,
      linkPreview,
    });

    setInput("");
    setAttachedFile(null);
    setReplyingTo(null);
    setShowMentions(false);
  };

  const handleDownloadTranscript = (format: "txt" | "json") => {
    if (onExportChat) {
      onExportChat(format);
      return;
    }

    // Client-side fallback export
    let content = "";
    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
    } else {
      content = messages
        .map((m) => `[${new Date(m.createdAt).toLocaleTimeString()}] ${m.senderName}: ${m.content}`)
        .join("\n");
    }

    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-chat-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 md:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxImage)}
          onClose={() => setLightboxImage(null)}
          imageUrl={lightboxImage.url}
          imageName={lightboxImage.name}
        />
      )}

      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <h3 className="text-white font-semibold text-base flex-1">In-call messages</h3>

        <div className="flex items-center gap-1">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen((s) => !s)}
            className={`p-1.5 rounded-lg transition-colors ${
              isSearchOpen ? "bg-white/20 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Export Dropdown */}
          <button
            onClick={() => handleDownloadTranscript("txt")}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Export Chat (.txt)"
          >
            <DownloadCloud className="w-4 h-4" />
          </button>

          {/* Close Chat */}
          <button
            onClick={toggleChat}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      {isSearchOpen && (
        <div className="px-3 py-2 bg-neutral-800/80 border-b border-white/10 flex items-center gap-2 animate-in fade-in">
          <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in chat..."
            className="bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none flex-1"
          />
          {searchQuery && (
            <span className="text-[10px] text-white/40 shrink-0">
              {displayedMessages.length} found
            </span>
          )}
          <button
            onClick={() => {
              setSearchQuery("");
              setIsSearchOpen(false);
            }}
            className="text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className="px-3 py-2 bg-indigo-950/80 border-b border-indigo-500/30 flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-indigo-300 block">
                Pinned by {pinnedMessage.senderName}
              </span>
              <span className="text-xs text-white/90 line-clamp-2">{pinnedMessage.content}</span>
            </div>
          </div>
          {isPrivileged && onPinMessage && (
            <button
              onClick={() => onPinMessage(pinnedMessage.id, false)}
              className="p-1 text-white/40 hover:text-white rounded shrink-0"
              title="Unpin message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Info notice */}
      <div className="px-4 py-1.5 bg-neutral-800/40 text-[11px] text-white/50 border-b border-white/5">
        Messages are visible to everyone in the call.
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 text-sm">
            <span>{searchQuery ? "No matching messages found." : "No messages yet."}</span>
            <span className="text-xs mt-1">Send a message or share a file with everyone.</span>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const Icon = msg.attachment ? getFileIcon(msg.attachment.type) : GenericFile;
            const canModerate = isPrivileged || msg.isSelf;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`group relative flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
              >
                {/* Sender Info & Timestamp */}
                <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
                  <span className="font-semibold text-white/80">{msg.senderName}</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.isPinned && (
                    <span className="flex items-center gap-0.5 text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </span>
                  )}
                </div>

                {/* Hover Actions Menu */}
                <div
                  className={`absolute -top-3 z-20 hidden group-hover:flex items-center gap-1 bg-neutral-800/95 border border-white/10 rounded-full px-2 py-1 shadow-lg backdrop-blur-sm transition-all ${
                    msg.isSelf ? "right-2" : "left-2"
                  }`}
                >
                  {/* React Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReactionMessageId(
                          activeReactionMessageId === msg.id ? null : msg.id
                        )
                      }
                      className="p-1 rounded-full text-white/60 hover:text-yellow-400 hover:bg-white/10"
                      title="React"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Reaction Emoji Picker */}
                    {activeReactionMessageId === msg.id && (
                      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/10 rounded-full p-1.5 flex items-center gap-1 shadow-2xl z-30 animate-in fade-in">
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              onReactMessage?.(msg.id, emoji);
                              setActiveReactionMessageId(null);
                            }}
                            className="p-1 hover:scale-125 transition-transform text-sm"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reply Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setReplyingTo({
                        id: msg.id,
                        senderName: msg.senderName,
                        content: msg.content || "Attachment",
                      })
                    }
                    className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {/* Pin Message (Host/Co-host) */}
                  {isPrivileged && onPinMessage && (
                    <button
                      type="button"
                      onClick={() => onPinMessage(msg.id, !msg.isPinned)}
                      className={`p-1 rounded-full transition-colors ${
                        msg.isPinned
                          ? "text-indigo-400 bg-white/10"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      title={msg.isPinned ? "Unpin message" : "Pin message"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Message */}
                  {canModerate && onDeleteMessage && (
                    <button
                      type="button"
                      onClick={() => onDeleteMessage(msg.id)}
                      className="p-1 rounded-full text-white/60 hover:text-red-400 hover:bg-white/10"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-2xl text-sm max-w-[85%] break-words flex flex-col gap-2 relative ${
                    msg.isSelf
                      ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                      : "bg-neutral-800 text-white/90 border border-white/5 rounded-bl-none shadow-sm"
                  } ${msg.isDeleted ? "opacity-60 italic" : ""}`}
                >
                  {/* Threaded Reply Context */}
                  {msg.replyTo && (
                    <div
                      onClick={() => {
                        const el = document.getElementById(`msg-${msg.replyTo?.id}`);
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`p-2 rounded-xl text-xs flex items-start gap-1.5 cursor-pointer border ${
                        msg.isSelf
                          ? "bg-black/20 border-white/15 text-white/80 hover:bg-black/30"
                          : "bg-neutral-900/60 border-white/10 text-white/70 hover:bg-neutral-900"
                      }`}
                    >
                      <Reply className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5 rotate-180" />
                      <div className="min-w-0 truncate">
                        <span className="font-semibold block truncate">
                          {msg.replyTo.senderName}
                        </span>
                        <span className="line-clamp-1 opacity-75">{msg.replyTo.content}</span>
                      </div>
                    </div>
                  )}

                  {/* Text content with mentions highlighted */}
                  {msg.content && (
                    <div className="leading-relaxed">
                      {msg.content.split(/(@[a-zA-Z0-9_\-.]+)/g).map((part, idx) => {
                        if (part.startsWith("@")) {
                          return (
                            <span
                              key={idx}
                              className="font-semibold text-indigo-200 bg-indigo-900/50 px-1 py-0.5 rounded text-xs border border-indigo-400/30"
                            >
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </div>
                  )}

                  {/* Link Preview Card */}
                  {msg.linkPreview && (
                    <a
                      href={msg.linkPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 rounded-xl bg-black/30 border border-white/10 p-2.5 flex items-center justify-between gap-2 hover:bg-black/40 transition-colors group/link"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white/90 block truncate group-hover/link:text-indigo-400 transition-colors">
                          {msg.linkPreview.title}
                        </span>
                        <span className="text-[10px] text-white/50 block truncate">
                          {msg.linkPreview.domain}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover/link:text-white shrink-0" />
                    </a>
                  )}

                  {/* Attachment Card */}
                  {msg.attachment && (
                    <div className="mt-1 rounded-xl bg-black/30 border border-white/10 p-2.5 flex flex-col gap-2">
                      {msg.attachment.type.startsWith("image/") && (
                        <div
                          onClick={() =>
                            setLightboxImage({
                              url: msg.attachment!.url,
                              name: msg.attachment!.name,
                            })
                          }
                          className="rounded-lg overflow-hidden max-h-48 border border-white/10 bg-black/40 cursor-pointer group/img relative"
                        >
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] bg-black/60 px-2 py-1 rounded-full text-white">
                              Click to view
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-white/10 text-white/80 shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold truncate block text-white/95">
                              {msg.attachment.name}
                            </span>
                            <span className="text-[10px] text-white/50 block">
                              {formatFileSize(msg.attachment.size)}
                            </span>
                          </div>
                        </div>

                        <a
                          href={msg.attachment.url}
                          download={msg.attachment.name}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
                          title="Download attachment"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reaction Badges Row */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                      if (!userIds || userIds.length === 0) return null;
                      const hasReacted = myParticipantId ? userIds.includes(myParticipantId) : false;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onReactMessage?.(msg.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border transition-all ${
                            hasReacted
                              ? "bg-indigo-950/80 border-indigo-500 text-indigo-300"
                              : "bg-neutral-800 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                          title={`${userIds.length} reaction${userIds.length > 1 ? "s" : ""}`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px] font-semibold">{userIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-neutral-800 border-t border-white/10 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs text-white/80 truncate">
              Replying to <strong className="text-white">{replyingTo.senderName}</strong>:{" "}
              {replyingTo.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded text-white/40 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mentions Autocomplete Popup */}
      {showMentions && filteredMentions.length > 0 && (
        <div className="px-2 py-1.5 bg-neutral-850 border-t border-white/10 max-h-36 overflow-y-auto space-y-1 animate-in fade-in">
          <span className="text-[10px] text-white/40 uppercase tracking-wider block px-2 py-0.5">
            Mention participant
          </span>
          {filteredMentions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectMention(p.name)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-white flex items-center gap-2 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Message Input Form or Disabled Banner */}
      {disableChat || isMuted ? (
        <div className="p-4 border-t border-white/10 bg-neutral-950/60 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          {isMuted
            ? "You have been muted in the chat by the host."
            : "In-call chat is currently disabled by the host."}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-neutral-900/50 flex flex-col gap-2">
          {/* File attachment preview chip */}
          {attachedFile && (
            <div className="px-3 py-1.5 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-xs text-white flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate font-medium">{attachedFile.file.name}</span>
                <span className="text-white/40 text-[10px]">({formatFileSize(attachedFile.file.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-1 rounded text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File attachment button */}
            <button
              type="button"
              disabled={disableFileShare}
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-full transition-colors ${
                disableFileShare
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title={disableFileShare ? "File sharing disabled by host" : "Attach a file (image, doc, zip)"}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={attachedFile ? "Add a message (optional)..." : "Send a message (@ to mention)"}
              className="flex-1 bg-neutral-800 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              disabled={!input.trim() && !attachedFile}
              className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
