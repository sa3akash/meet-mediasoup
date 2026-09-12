"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PreJoinLobby } from "../lobby/pre-join-lobby";
import { MeetingGrid } from "./meeting-grid";
import { ControlBar } from "./control-bar";
import { ChatPanel } from "../chat/chat-panel";
import { HostControlsModal } from "../meetings/host-controls-modal";
import { WaitingRoomManager } from "../meetings/waiting-room-manager";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { useMediasoup } from "../../hooks/use-mediasoup";
import { Disc, PhoneOff } from "lucide-react";

interface Message {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
  isSelf?: boolean;
}

interface MeetingRoomClientProps {
  slug: string;
  initialMeeting?: any;
}

export function MeetingRoomClient({ slug, initialMeeting }: MeetingRoomClientProps) {
  const router = useRouter();
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState<any>(initialMeeting?.settings || {});
  const [meetingEndedModal, setMeetingEndedModal] = useState(false);

  const { isChatOpen, isHost, setMeeting, reset: resetMeeting } = useMeetingStore();
  const { resetMedia } = useMediaStore();

  const {
    sendRequest,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useMediasoup(hasJoined ? slug : "", displayName);

  useEffect(() => {
    if (initialMeeting) {
      setMeeting({
        id: initialMeeting.id,
        slug: initialMeeting.slug,
        title: initialMeeting.title || "Meeting Room",
        isHost: true, // Default to host permissions for meeting creator
      });
      if (initialMeeting.settings) {
        setMeetingSettings(initialMeeting.settings);
      }
    }
  }, [initialMeeting, setMeeting]);

  const handleJoin = (name: string) => {
    setDisplayName(name);
    setHasJoined(true);
  };

  const handleLeave = () => {
    resetMedia();
    resetMeeting();
    router.push("/meetings");
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
    if (!isHost && meetingSettings.disableReactions) return;
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2500);
    sendRequest("reaction:add", { emoji }).catch(() => {});
  };

  const handleBroadcastSettings = (updated: any) => {
    setMeetingSettings(updated);
    sendRequest("meeting:updateSettings", { settings: updated }).catch(() => {});
  };

  if (!hasJoined) {
    return (
      <PreJoinLobby
        meetingTitle={initialMeeting?.title || `Meeting Room (${slug})`}
        slug={slug}
        meetingData={initialMeeting}
        onJoin={handleJoin}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col">
      {/* Auto Cloud Recording Status Indicator */}
      {meetingSettings.autoRecording && (
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md animate-pulse">
          <Disc className="w-3.5 h-3.5 animate-spin" />
          <span>REC (Cloud)</span>
        </div>
      )}

      {/* Floating Reaction Animation */}
      {activeReaction && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl animate-bounce z-50 pointer-events-none drop-shadow-2xl">
          {activeReaction}
        </div>
      )}

      {/* Meeting Ended Modal */}
      {meetingEndedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <PhoneOff className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg">Meeting Ended</h3>
            <p className="text-neutral-400 text-xs">The host has ended this meeting for all participants.</p>
            <button
              onClick={() => router.push("/meetings")}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Waiting Room Real-time Management */}
      <WaitingRoomManager meetingId={slug} hostId={initialMeeting?.hostId || ""} />

      {/* Host Controls Modal with all 10 settings */}
      <HostControlsModal
        meetingId={slug}
        initialLocked={meetingSettings.lockMeeting}
        initialSettings={meetingSettings}
        isOpen={isHostControlsOpen}
        onClose={() => setIsHostControlsOpen(false)}
        onBroadcastSettings={handleBroadcastSettings}
      />

      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MeetingGrid localDisplayName={displayName} />
        {isChatOpen && (
          <ChatPanel
            onSendMessage={handleSendMessage}
            messages={messages}
            disableChat={!isHost && meetingSettings.disableChat}
            disableFileShare={!isHost && meetingSettings.disableFileShare}
          />
        )}
      </div>

      <ControlBar
        onLeave={handleLeave}
        onSendReaction={handleSendReaction}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        disableScreenShare={!isHost && meetingSettings.disableScreenShare}
        disableReactions={!isHost && meetingSettings.disableReactions}
        disableChat={!isHost && meetingSettings.disableChat}
        isLocked={meetingSettings.lockMeeting}
      />
    </div>
  );
}
