"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PreJoinLobby } from "../lobby/pre-join-lobby";
import { MeetingGrid } from "./meeting-grid";
import { ControlBar } from "./control-bar";
import { ChatPanel } from "../chat/chat-panel";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { useMediasoup } from "../../hooks/use-mediasoup";

interface Message {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
}

export function MeetingRoomClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const { isChatOpen, reset: resetMeeting } = useMeetingStore();
  const { resetMedia } = useMediaStore();

  const { sendRequest } = useMediasoup(hasJoined ? slug : "", displayName);

  const handleJoin = (name: string) => {
    setDisplayName(name);
    setHasJoined(true);
  };

  const handleLeave = () => {
    resetMedia();
    resetMeeting();
    router.push("/");
  };

  const handleSendMessage = async (content: string) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      senderName: displayName,
      content,
      createdAt: new Date().toISOString(),
      isSelf: true,
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await sendRequest("chat:send", { content });
    } catch {}
  };

  const handleSendReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2500);
    sendRequest("reaction:add", { emoji }).catch(() => {});
  };

  if (!hasJoined) {
    return <PreJoinLobby meetingTitle={`Meeting Room (${slug})`} onJoin={handleJoin} />;
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col">
      {activeReaction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-bounce z-50 pointer-events-none drop-shadow-2xl">
          {activeReaction}
        </div>
      )}

      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MeetingGrid localDisplayName={displayName} />
        {isChatOpen && <ChatPanel onSendMessage={handleSendMessage} messages={messages} />}
      </div>

      <ControlBar onLeave={handleLeave} onSendReaction={handleSendReaction} />
    </div>
  );
}
