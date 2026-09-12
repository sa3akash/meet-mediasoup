"use client";

import { useState, useCallback } from "react";
import type { Message, MessageAttachment, MessageReplyTo } from "../features/chat/chat-types";

interface UseChatPanelProps {
  onSendMessage: (
    content: string,
    options?: {
      attachment?: MessageAttachment;
      replyTo?: MessageReplyTo;
      mentions?: string[];
    }
  ) => void;
}

export function useChatPanel({ onSendMessage }: UseChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<MessageReplyTo | null>(null);
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed && !attachment) return;

    // Extract @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(trimmed)) !== null) {
      mentions.push(match[1]);
    }

    onSendMessage(trimmed, {
      attachment: attachment || undefined,
      replyTo: replyingTo || undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
    });

    setInputText("");
    setReplyingTo(null);
    setAttachment(null);
  }, [inputText, attachment, replyingTo, onSendMessage]);

  const filterMessages = useCallback(
    (messages: Message[]) => {
      if (!searchQuery.trim()) return messages;
      const q = searchQuery.toLowerCase();
      return messages.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          m.attachment?.name.toLowerCase().includes(q)
      );
    },
    [searchQuery]
  );

  return {
    inputText,
    setInputText,
    replyingTo,
    setReplyingTo,
    attachment,
    setAttachment,
    searchQuery,
    setSearchQuery,
    handleSend,
    filterMessages,
  };
}
