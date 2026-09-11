"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PreJoinLobby } from "../../../features/lobby/pre-join-lobby";
import { MeetingGrid } from "../../../features/meeting/meeting-grid";
import { ControlBar } from "../../../features/meeting/control-bar";
import { ChatPanel } from "../../../features/chat/chat-panel";
import { useMeetingStore } from "../../../stores/meeting-store";
import { useMediaStore } from "../../../stores/media-store";
import { useMediasoup } from "../../../hooks/use-mediasoup";

interface Message {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
}

export default function MeetingRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = resolvedParams.slug;

  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const { isChatOpen, reset: resetMeeting } = useMeetingStore();
  const { resetMedia } = useMediaStore();

  // Initialize WebRTC SFU connection when user joins
  const { sendRequest } = useMediasoup(
    hasJoined ? slug : "",
    displayName
  );

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
    } catch (e) {
      console.warn("Failed to dispatch chat message:", e);
    }
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
      {/* Floating Reaction Overlay */}
      {activeReaction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-bounce z-50 pointer-events-none drop-shadow-2xl">
          {activeReaction}
        </div>
      )}

      {/* Main Workspace: Video Grid & Slide-in Chat Drawer */}
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MeetingGrid localDisplayName={displayName} />
        {isChatOpen && (
          <ChatPanel onSendMessage={handleSendMessage} messages={messages} />
        )}
      </div>

      {/* Bottom Google Meet Controls */}
      <ControlBar onLeave={handleLeave} onSendReaction={handleSendReaction} />
    </div>
  );
}
