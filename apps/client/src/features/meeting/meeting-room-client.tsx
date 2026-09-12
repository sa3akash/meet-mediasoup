"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PreJoinLobby } from "../lobby/pre-join-lobby";
import { MeetingGrid } from "./meeting-grid";
import { ControlBar } from "./control-bar";
import { ChatPanel } from "../chat/chat-panel";
import { ParticipantsPanel } from "./participants-panel";
import { HostControlsModal } from "../meetings/host-controls-modal";
import { WaitingRoomManager } from "../meetings/waiting-room-manager";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { useMediasoup } from "../../hooks/use-mediasoup";
import { Disc, PhoneOff, X } from "lucide-react";

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
  currentUser?: any;
}

function playMessageChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.09); // A5
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch {}
}

export function MeetingRoomClient({ slug, initialMeeting, currentUser }: MeetingRoomClientProps) {
  const router = useRouter();
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.name || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [latestMessageToast, setLatestMessageToast] = useState<{
    id: string;
    senderName: string;
    content: string;
  } | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState<any>(initialMeeting?.settings || {});
  const [meetingEndedModal, setMeetingEndedModal] = useState(false);

  const {
    isChatOpen,
    toggleChat,
    isParticipantsListOpen,
    isHandRaised,
    setHandRaised,
    isHost,
    setMeeting,
    reset: resetMeeting,
  } = useMeetingStore();
  const { resetMedia } = useMediaStore();

  const isMeetingHost = Boolean(
    (currentUser?.id && initialMeeting?.hostId && currentUser.id === initialMeeting.hostId) ||
    initialMeeting?.isHost ||
    (!initialMeeting?.hostId && !currentUser?.id)
  );

  const handleIncomingMessage = useCallback((msg: any) => {
    const newMsg: Message = {
      id: msg.id || crypto.randomUUID(),
      senderName: msg.senderName || "Participant",
      content: msg.content,
      createdAt: msg.createdAt || new Date().toISOString(),
      isSelf: false,
    };
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    if (!useMeetingStore.getState().isChatOpen) {
      setUnreadMessagesCount((prev) => prev + 1);
      setLatestMessageToast({
        id: newMsg.id,
        senderName: newMsg.senderName,
        content: newMsg.content,
      });
      playMessageChime();
    }
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      setUnreadMessagesCount(0);
      setLatestMessageToast(null);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (latestMessageToast) {
      const timer = setTimeout(() => {
        setLatestMessageToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [latestMessageToast]);

  const handleIncomingReaction = useCallback((emoji: string) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2500);
  }, []);

  const handleIncomingSettings = useCallback((settings: any) => {
    setMeetingSettings(settings);
  }, []);

  const handleIncomingMeetingEnded = useCallback(() => {
    setMeetingEndedModal(true);
  }, []);

  const {
    sendRequest,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useMediasoup(
    hasJoined ? slug : "",
    displayName,
    currentUser?.id,
    {
      onChatMessage: handleIncomingMessage,
      onReactionReceived: handleIncomingReaction,
      onSettingsUpdated: handleIncomingSettings,
      onMeetingEnded: handleIncomingMeetingEnded,
    },
    isMeetingHost ? "HOST" : "PARTICIPANT"
  );

  useEffect(() => {
    if (initialMeeting) {
      setMeeting({
        id: initialMeeting.id,
        slug: initialMeeting.slug,
        title: initialMeeting.title || "Meeting Room",
        isHost: isMeetingHost,
      });
      if (initialMeeting.settings) {
        setMeetingSettings(initialMeeting.settings);
      }
    }
  }, [initialMeeting, isMeetingHost, setMeeting]);

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
    const msgId = crypto.randomUUID();
    const newMsg: Message = {
      id: msgId,
      senderName: displayName,
      content,
      createdAt: new Date().toISOString(),
      isSelf: true,
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await sendRequest("chat:send", { content, id: msgId });
    } catch (err) {
      console.warn("[Chat] Failed to send message:", err);
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (!isHost && meetingSettings.disableReactions) return;
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 2500);
    sendRequest("reaction:add", { emoji }).catch(() => {});
  };

  const handleToggleHandRaise = () => {
    const nextState = !isHandRaised;
    setHandRaised(nextState);
    sendRequest("participant:updateMediaState", { isHandRaised: nextState }).catch(() => {});
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
        initialDisplayName={displayName || currentUser?.name || ""}
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
        onEndMeetingForAll={() => sendRequest("meeting:endForAll").catch(() => {})}
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
        {isParticipantsListOpen && (
          <ParticipantsPanel localDisplayName={displayName} />
        )}
      </div>

      {/* Floating In-Call Message Toast Notification (Google Meet Style) */}
      {latestMessageToast && !isChatOpen && (
        <div
          onClick={() => {
            toggleChat();
            setLatestMessageToast(null);
          }}
          className="absolute bottom-24 left-6 z-40 max-w-sm bg-neutral-900/95 hover:bg-neutral-850 text-white border border-white/15 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3 cursor-pointer transition-all duration-300 animate-in slide-in-from-bottom-4 hover:scale-[1.02]"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
            {(latestMessageToast.senderName || "P").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-semibold text-white/90 truncate">
                {latestMessageToast.senderName}
              </span>
              <span className="text-[10px] text-indigo-400 font-medium shrink-0">Reply</span>
            </div>
            <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              {latestMessageToast.content}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLatestMessageToast(null);
            }}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <ControlBar
        onLeave={handleLeave}
        onSendReaction={handleSendReaction}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        disableScreenShare={!isHost && meetingSettings.disableScreenShare}
        disableReactions={!isHost && meetingSettings.disableReactions}
        disableChat={!isHost && meetingSettings.disableChat}
        isLocked={meetingSettings.lockMeeting}
        unreadMessagesCount={unreadMessagesCount}
      />
    </div>
  );
}
