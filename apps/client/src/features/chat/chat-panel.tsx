"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";

interface Message {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
}

interface ChatPanelProps {
  onSendMessage: (content: string) => void;
  messages: Message[];
}

export function ChatPanel({ onSendMessage, messages }: ChatPanelProps) {
  const { toggleChat } = useMeetingStore();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="w-80 md:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">In-call messages</h3>
        <button
          onClick={toggleChat}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-2 bg-neutral-800/40 text-xs text-white/50 border-b border-white/5">
        Messages can only be seen by people in the call and are deleted when the call ends.
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 text-sm">
            <span>No messages yet.</span>
            <span className="text-xs mt-1">Send a message to everyone in the call.</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
                <span className="font-semibold text-white/80">{msg.senderName}</span>
                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div
                className={`px-3.5 py-2 rounded-2xl text-sm max-w-[85%] break-words ${
                  msg.isSelf
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-neutral-800 text-white/90 border border-white/5 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-neutral-900/50 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message to everyone"
          className="flex-1 bg-neutral-800 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
