"use client";

import { useState, useRef } from "react";
import { X, Send, Paperclip, FileText, Image as ImageIcon, Download, FileArchive, File as GenericFile } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";

export interface MessageAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
  attachment?: MessageAttachment;
}

interface ChatPanelProps {
  onSendMessage: (content: string, attachment?: MessageAttachment) => void;
  messages: Message[];
  disableChat?: boolean;
  disableFileShare?: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("compressed")) return FileArchive;
  if (type.includes("pdf") || type.includes("text") || type.includes("document") || type.includes("word")) return FileText;
  return GenericFile;
}

export function ChatPanel({ onSendMessage, messages, disableChat, disableFileShare }: ChatPanelProps) {
  const { toggleChat } = useMeetingStore();
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (disableChat) return;
    if (!input.trim() && !attachedFile) return;

    const attachment: MessageAttachment | undefined = attachedFile
      ? {
          name: attachedFile.file.name,
          size: attachedFile.file.size,
          type: attachedFile.file.type,
          url: attachedFile.dataUrl,
        }
      : undefined;

    onSendMessage(input.trim() || (attachedFile ? attachedFile.file.name : ""), attachment);
    setInput("");
    setAttachedFile(null);
  };

  return (
    <div className="w-80 md:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">In-call messages</h3>
        <button
          onClick={toggleChat}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-2 bg-neutral-800/40 text-xs text-white/50 border-b border-white/5">
        Messages & attachments are visible to everyone in the call.
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 text-sm">
            <span>No messages yet.</span>
            <span className="text-xs mt-1">Send a message or share a file with everyone.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const Icon = msg.attachment ? getFileIcon(msg.attachment.type) : GenericFile;
            return (
              <div key={msg.id} className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
                  <span className="font-semibold text-white/80">{msg.senderName}</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-sm max-w-[85%] break-words flex flex-col gap-2 ${
                    msg.isSelf
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-neutral-800 text-white/90 border border-white/5 rounded-bl-none"
                  }`}
                >
                  {/* Text content */}
                  {msg.content && <div>{msg.content}</div>}

                  {/* Attachment Card */}
                  {msg.attachment && (
                    <div className="mt-1 rounded-xl bg-black/30 border border-white/10 p-2.5 flex flex-col gap-2">
                      {msg.attachment.type.startsWith("image/") && (
                        <div className="rounded-lg overflow-hidden max-h-48 border border-white/10 bg-black/40">
                          <img
                            src={msg.attachment.url}
                            alt={msg.attachment.name}
                            className="w-full h-full object-cover"
                          />
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
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Form or Disabled Banner */}
      {disableChat ? (
        <div className="p-4 border-t border-white/10 bg-neutral-950/60 text-center text-xs text-neutral-400">
          In-call chat is currently disabled by the host.
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
              title={disableFileShare ? "File sharing disabled by host" : "Attach a file"}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={attachedFile ? "Add a message (optional)..." : "Send a message to everyone"}
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
