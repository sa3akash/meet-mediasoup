/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { PreJoinLobby } from "../lobby/pre-join-lobby";
import { MeetingGrid } from "./meeting-grid";
import { ControlBar } from "./control-bar";
import { ChatPanel, type Message, type MessageAttachment } from "../chat/chat-panel";
import { ParticipantsPanel } from "./participants-panel";
import { PollsPanel } from "./polls-panel";
import { BreakoutRoomsModal } from "./breakout-rooms-modal";
import { ScreenShareModal } from "./screen-share-modal";
import { PresenterControlDock } from "./presenter-control-dock";
import { Disc } from "lucide-react";
import { HostControlsModal } from "../meetings/host-controls-modal";
import { WaitingRoomManager } from "../meetings/waiting-room-manager";
import { RecordingModal } from "../recording/recording-modal";
import { LocalRecorder } from "../recording/local-recorder";
import { LiveStreamingModal } from "../streaming/live-streaming-modal";
import { WhiteboardModal, type WhiteboardElement } from "../whiteboard/whiteboard-modal";
import { FilesPanel } from "../files/files-panel";
import { NotificationCenter, type NotificationItem } from "../notifications/notification-center";
import { ReportModal } from "./components/report-modal";
import {
  BreakoutStateEvent,
  MediaForcedEvent,
  PollData,
  useMediasoup,
} from "../../hooks/use-mediasoup";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { PhoneOff, X, UserX, Mic, MicOff, Video, Megaphone } from "lucide-react";

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
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const [mediaPrompt, setMediaPrompt] = useState<MediaForcedEvent | null>(null);
  const [mediaNotification, setMediaNotification] = useState<string | null>(null);

  // Polls & Breakout Rooms State
  const [polls, setPolls] = useState<PollData[]>([]);
  const [breakoutState, setBreakoutState] = useState<BreakoutStateEvent | null>(null);
  const [isBreakoutSetupOpen, setIsBreakoutSetupOpen] = useState(false);
  const [breakoutBroadcastToast, setBreakoutBroadcastToast] = useState<{
    message: string;
    from: string;
  } | null>(null);

  // Screen Share Modal State
  const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);

  // Moderation Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState<{ id: string; name: string } | null>(null);

  const {
    isChatOpen,
    toggleChat,
    isWhiteboardOpen,
    toggleWhiteboard,
    isFileShareOpen,
    toggleFileShare,
    isStreamingModalOpen,
    toggleStreamingModal,
    isNotificationCenterOpen,
    toggleNotificationCenter,
    isLiveStreaming,
    isParticipantsListOpen,
    isHandRaised,
    setHandRaised,
    isHost,
    setMeeting,
    reset: resetMeeting,
    isRecording,
    recordingType,
    recordingDuration,
    setRecordingState,
    setRecordingDuration,
    setRecordingDownloadUrl,
    setPinnedMessage,
    setChatUserMuted,
    myParticipantId,
  } = useMeetingStore();
  const { resetMedia } = useMediaStore();

  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<any[]>([]);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const localRecorderRef = useRef<LocalRecorder | null>(null);

  const isMeetingHost = Boolean(
    (currentUser?.id && initialMeeting?.hostId && currentUser.id === initialMeeting.hostId) ||
    initialMeeting?.isHost ||
    (!initialMeeting?.hostId && !currentUser?.id)
  );

  const handleIncomingMessage = useCallback((msg: any) => {
    const newMsg: Message = {
      id: msg.id || crypto.randomUUID(),
      senderName: msg.senderName || "Participant",
      content: msg.content || (msg.attachment ? `Shared a file: ${msg.attachment.name}` : ""),
      createdAt: msg.createdAt || new Date().toISOString(),
      isSelf: false,
      attachment: msg.attachment,
      replyTo: msg.replyTo,
      mentions: msg.mentions,
      linkPreview: msg.linkPreview,
      reactions: msg.reactions || {},
      isPinned: msg.isPinned || false,
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
        content: newMsg.content || (newMsg.attachment ? `Shared a file: ${newMsg.attachment.name}` : ""),
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

  const handleKicked = useCallback((reason: string) => {
    setKickedReason(reason || "You have been removed from the meeting by the host.");
  }, []);

  const handleMediaForced = useCallback((event: MediaForcedEvent) => {
    if (event.muted) {
      setMediaNotification(
        event.reason ||
          (event.mediaType === "audio"
            ? "The host has muted your microphone."
            : "The host has turned off your camera.")
      );
      setTimeout(() => setMediaNotification(null), 5000);
    } else {
      setMediaPrompt(event);
    }
  }, []);

  const handlePollNew = useCallback((poll: PollData) => {
    setPolls((prev) => [poll, ...prev.filter((p) => p.id !== poll.id)]);
  }, []);

  const handlePollUpdated = useCallback((poll: PollData) => {
    setPolls((prev) => prev.map((p) => (p.id === poll.id ? poll : p)));
  }, []);

  const handlePollEnded = useCallback((pollId: string, poll: PollData) => {
    setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...poll, isActive: false } : p)));
  }, []);

  const handleBreakoutStarted = useCallback((data: BreakoutStateEvent) => {
    setBreakoutState(data);
  }, []);

  const handleBreakoutBroadcast = useCallback((data: { message: string; from: string }) => {
    setBreakoutBroadcastToast(data);
    setTimeout(() => setBreakoutBroadcastToast(null), 6000);
  }, []);

  const handleBreakoutEnded = useCallback(() => {
    setBreakoutState(null);
  }, []);

  const {
    sendRequest,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    pauseScreenShare,
    toggleScreenAudio,
    kickParticipant,
    controlParticipantMedia,
    muteAllParticipants,
    promoteParticipant,
    spotlightParticipant,
    createPoll,
    votePoll,
    endPoll,
    listPolls,
    startBreakoutRooms,
    broadcastToBreakoutRooms,
    endBreakoutRooms,
    sendChatMessage,
    reactToChatMessage,
    deleteChatMessage,
    pinChatMessage,
    muteChatParticipant,
    exportMeetingChat,
    startCloudRecording,
    stopCloudRecording,
    startLiveStream,
    stopLiveStream,
    getLiveStreamStatus,
    sendWhiteboardElement,
    sendWhiteboardUpdate,
    sendWhiteboardClear,
    fetchWhiteboardState,
    uploadSharedFile,
    fetchSharedFiles,
    deleteSharedFile,
    sendNotificationRpc,
    fetchNotifications,
    markNotificationRead,
  } = useMediasoup(
    hasJoined ? slug : "",
    displayName,
    currentUser?.id,
    {
      onChatMessage: handleIncomingMessage,
      onReactionReceived: handleIncomingReaction,
      onSettingsUpdated: handleIncomingSettings,
      onMeetingEnded: handleIncomingMeetingEnded,
      onKicked: handleKicked,
      onMediaForced: handleMediaForced,
      onPollNew: handlePollNew,
      onPollUpdated: handlePollUpdated,
      onPollEnded: handlePollEnded,
      onBreakoutStarted: handleBreakoutStarted,
      onBreakoutBroadcast: handleBreakoutBroadcast,
      onBreakoutEnded: handleBreakoutEnded,
      onChatHistory: (history: any[]) => {
        if (Array.isArray(history)) {
          setMessages(history.map((m) => ({ ...m, isSelf: m.senderId === useMeetingStore.getState().myParticipantId })));
        }
      },
      onChatReacted: (data: any) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
        );
      },
      onChatMessageDeleted: (data: any) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.messageId
              ? { ...m, isDeleted: true, content: "This message was deleted.", attachment: undefined }
              : m
          )
        );
      },
      onChatMessagePinned: (data: any) => {
        setPinnedMessage(data.isPinned ? data.message : null);
        setMessages((prev) =>
          prev.map((m) => ({ ...m, isPinned: m.id === data.messageId ? data.isPinned : false }))
        );
      },
      onChatUserMuted: (data: any) => {
        setChatUserMuted(data.targetParticipantId, data.muted);
      },
      onRecordingStarted: () => {
        setRecordingState(true, "CLOUD");
      },
      onRecordingStopped: (data: any) => {
        setRecordingState(false, null);
        if (data?.mp4Url) {
          setRecordingDownloadUrl(data.mp4Url);
        }
      },
      onWhiteboardElementAdded: (data: any) => {
        if (data?.element) {
          setWhiteboardElements((prev) => [...prev, data.element]);
        }
      },
      onWhiteboardElementUpdated: (data: any) => {
        if (data?.element) {
          setWhiteboardElements((prev) =>
            prev.map((el) => (el.id === data.element.id ? data.element : el))
          );
        }
      },
      onWhiteboardCleared: () => {
        setWhiteboardElements([]);
      },
      onFileUploaded: (data: any) => {
        if (data?.file) {
          setRemoteFiles((prev) => [data.file, ...prev]);
        }
      },
      onFileDeleted: (data: any) => {
        if (data?.fileId) {
          setRemoteFiles((prev) => prev.filter((f) => f.id !== data.fileId));
        }
      },
      onNotificationReceived: (data: any) => {
        if (data?.notification) {
          setLatestNotification(data.notification);
          setUnreadNotificationsCount((c) => c + 1);
          playMessageChime();
        }
      },
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

  useEffect(() => {
    if (hasJoined) {
      listPolls()
        .then((res: any) => {
          if (res && Array.isArray(res.polls)) {
            setPolls(res.polls);
          }
        })
        .catch(() => {});
    }
  }, [hasJoined, listPolls]);

  const currentBreakoutRoom = useMemo(() => {
    if (!breakoutState?.rooms) return null;
    const myPid = useMeetingStore.getState().myParticipantId;
    if (!myPid) return null;
    return breakoutState.rooms.find((r: any) => r.participantIds.includes(myPid)) || null;
  }, [breakoutState]);

  const handleLeave = () => {
    resetMedia();
    resetMeeting();
    router.push("/meetings");
  };

  const handleSendMessage = async (
    content: string,
    options?: {
      attachment?: MessageAttachment;
      replyTo?: any;
      mentions?: string[];
      linkPreview?: any;
    }
  ) => {
    const msgId = crypto.randomUUID();
    const newMsg: Message = {
      id: msgId,
      senderName: displayName,
      content,
      createdAt: new Date().toISOString(),
      isSelf: true,
      attachment: options?.attachment,
      replyTo: options?.replyTo,
      mentions: options?.mentions,
      linkPreview: options?.linkPreview,
    };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await sendChatMessage(content, {
        attachment: options?.attachment,
        replyTo: options?.replyTo,
        mentions: options?.mentions,
        linkPreview: options?.linkPreview,
      });
    } catch (err: any) {
      console.warn("[Chat] Failed to send message:", err);
      alert(err.message || "Failed to send message");
    }
  };

  const handleReactMessage = useCallback((messageId: string, emoji: string) => {
    reactToChatMessage(messageId, emoji).catch(() => {});
  }, [reactToChatMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    deleteChatMessage(messageId).catch(() => {});
  }, [deleteChatMessage]);

  const handlePinMessage = useCallback((messageId: string, isPinned: boolean) => {
    pinChatMessage(messageId, isPinned).catch(() => {});
  }, [pinChatMessage]);

  const handleMuteUser = useCallback((participantId: string, muted: boolean) => {
    muteChatParticipant(participantId, muted).catch(() => {});
  }, [muteChatParticipant]);

  const handleExportChat = useCallback((format: "txt" | "json") => {
    exportMeetingChat(format)
      .then((res: any) => {
        if (res?.transcript) {
          const blob = new Blob([res.transcript], {
            type: format === "json" ? "application/json" : "text/plain",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `meeting-${slug}-chat.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {});
  }, [exportMeetingChat, slug]);

  const handleStartCloudRecording = useCallback(async (recordType: any) => {
    await startCloudRecording(recordType);
    setRecordingState(true, "CLOUD");
  }, [startCloudRecording, setRecordingState]);

  const handleStopCloudRecording = useCallback(async () => {
    const res = await stopCloudRecording();
    setRecordingState(false, null);
    if (res?.mp4Url) {
      setRecordingDownloadUrl(res.mp4Url);
    }
    return res;
  }, [stopCloudRecording, setRecordingState, setRecordingDownloadUrl]);

  const handleStartLocalRecording = useCallback(async (recordType: any) => {
    const { localStream, screenStream, remoteStreams } = useMediaStore.getState();
    const recorder = new LocalRecorder({
      recordType,
      localStream,
      screenStream,
      remoteStreams,
      meetingTitle: initialMeeting?.title || slug,
      onDurationUpdate: (secs) => setLocalDuration(secs),
      onStop: (downloadUrl) => {
        setRecordingDownloadUrl(downloadUrl);
        setRecordingState(false, null);
      },
    });

    await recorder.start();
    localRecorderRef.current = recorder;
    setRecordingState(true, "LOCAL");
  }, [initialMeeting, slug, setRecordingDownloadUrl, setRecordingState]);

  const handleStopLocalRecording = useCallback(() => {
    if (localRecorderRef.current) {
      localRecorderRef.current.stop();
      localRecorderRef.current = null;
    }
    setRecordingState(false, null);
  }, [setRecordingState]);

  useEffect(() => {
    if (isRecording && recordingType === "CLOUD") {
      const interval = setInterval(() => {
        setRecordingDuration(useMeetingStore.getState().recordingDuration + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, recordingType, setRecordingDuration]);

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
        userId={currentUser?.id}
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
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold text-xs"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Kicked / Removed from Meeting Modal */}
      {kickedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg">Removed from Meeting</h3>
            <p className="text-neutral-400 text-xs">
              {kickedReason || "You have been removed from the meeting by the host."}
            </p>
            <button
              onClick={() => router.push("/meetings")}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold text-xs"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification when Host Mutes Participant */}
      {mediaNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 text-white border border-red-500/30 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <MicOff className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-neutral-200">{mediaNotification}</span>
        </div>
      )}

      {/* Media Request Prompt (When Host asks participant to unmute or turn on camera) */}
      {mediaPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {mediaPrompt.mediaType === "audio" ? <Mic className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </div>
            <h3 className="text-white font-bold text-base">
              {mediaPrompt.mediaType === "audio" ? "Unmute your microphone?" : "Turn on your camera?"}
            </h3>
            <p className="text-neutral-300 text-xs leading-relaxed">
              {mediaPrompt.reason || "The host is asking you to share your audio/video in the meeting."}
            </p>
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                onClick={() => setMediaPrompt(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
              >
                {mediaPrompt.mediaType === "audio" ? "Stay Muted" : "Keep Off"}
              </button>
              <button
                onClick={() => {
                  if (mediaPrompt.mediaType === "audio") {
                    toggleAudio();
                  } else {
                    toggleVideo();
                  }
                  setMediaPrompt(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
              >
                {mediaPrompt.mediaType === "audio" ? "Unmute" : "Turn On"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Room Real-time Management */}
      <WaitingRoomManager meetingId={slug} hostId={initialMeeting?.hostId || ""} />

      {/* Host Controls Modal with all settings & passcode controls */}
      <HostControlsModal
        meetingId={slug}
        initialLocked={meetingSettings.lockMeeting}
        initialSettings={meetingSettings}
        initialPasscode={initialMeeting?.passcode}
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
            onReactMessage={handleReactMessage}
            onDeleteMessage={handleDeleteMessage}
            onPinMessage={handlePinMessage}
            onMuteUser={handleMuteUser}
            onExportChat={handleExportChat}
            messages={messages}
            disableChat={!isHost && meetingSettings.disableChat}
            disableFileShare={!isHost && meetingSettings.disableFileShare}
          />
        )}
        {isParticipantsListOpen && (
          <ParticipantsPanel
            localDisplayName={displayName}
            onKickParticipant={kickParticipant}
            onControlParticipantMedia={controlParticipantMedia}
            onMuteAll={muteAllParticipants}
            onPromoteParticipant={promoteParticipant}
            onSpotlightParticipant={spotlightParticipant}
            onReportParticipant={(target) => {
              setReportingTarget(target);
              setIsReportModalOpen(true);
            }}
          />
        )}
        <PollsPanel
          polls={polls}
          breakoutState={breakoutState}
          currentBreakoutRoom={currentBreakoutRoom}
          onCreatePoll={createPoll}
          onVotePoll={votePoll}
          onEndPoll={endPoll}
          onOpenBreakoutSetup={() => setIsBreakoutSetupOpen(true)}
          onBroadcastBreakout={broadcastToBreakoutRooms}
          onEndBreakout={endBreakoutRooms}
        />
      </div>

      {/* Breakout Broadcast Floating Announcement */}
      {breakoutBroadcastToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 max-w-md bg-indigo-600/95 text-white border border-indigo-400/30 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider block">
              Host Announcement
            </span>
            <p className="text-xs font-medium text-white line-clamp-2">
              {breakoutBroadcastToast.message}
            </p>
          </div>
          <button
            onClick={() => setBreakoutBroadcastToast(null)}
            className="p-1 text-white/60 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Recording Badge at Top Left */}
      {isRecording && (
        <div
          onClick={() => setIsRecordingModalOpen(true)}
          className="absolute top-4 left-6 z-40 bg-red-950/90 border border-red-500/40 text-white rounded-full px-3.5 py-1.5 shadow-xl backdrop-blur-md flex items-center gap-2 cursor-pointer hover:bg-red-900/90 transition-all animate-pulse"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-mono font-bold text-red-300">REC</span>
          <span className="text-xs font-mono text-white/90">
            {Math.floor((recordingType === "LOCAL" ? localDuration : recordingDuration) / 60)
              .toString()
              .padStart(2, "0")}
            :
            {((recordingType === "LOCAL" ? localDuration : recordingDuration) % 60)
              .toString()
              .padStart(2, "0")}
          </span>
          <span className="text-[10px] text-red-300/70 capitalize">
            ({recordingType?.toLowerCase()})
          </span>
        </div>
      )}

      {/* Breakout Room Indicator Bar (if assigned to breakout room) */}
      {currentBreakoutRoom && (
        <div className="absolute top-4 left-44 z-40 bg-neutral-900/90 border border-indigo-500/30 text-white rounded-2xl px-4 py-2 shadow-xl backdrop-blur-md flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">
            {currentBreakoutRoom.name}
          </span>
          <span className="text-[11px] text-white/50">| Breakout Session</span>
        </div>
      )}

      {/* Breakout Rooms Modal for Host Setup */}
      <BreakoutRoomsModal
        isOpen={isBreakoutSetupOpen}
        onClose={() => setIsBreakoutSetupOpen(false)}
        onStartBreakout={startBreakoutRooms}
      />

      {/* Presenter Floating Control Dock */}
      <PresenterControlDock
        onStopShare={stopScreenShare}
        onPauseShare={pauseScreenShare}
        onToggleAudio={toggleScreenAudio}
      />

      {/* Screen Share Surface & Audio Picker Modal */}
      <ScreenShareModal
        isOpen={isScreenShareModalOpen}
        onClose={() => setIsScreenShareModalOpen(false)}
        onStartShare={startScreenShare}
      />

      {/* Floating In-Call Message Toast Notification (Google Meet Style) */}
      {latestMessageToast && !isChatOpen && (
        <div
          onClick={() => {
            toggleChat();
            setLatestMessageToast(null);
          }}
          className="absolute bottom-24 left-6 z-40 max-w-sm bg-neutral-900/95 hover:bg-neutral-850 text-white border border-white/15 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3 cursor-pointer transition-all duration-300 animate-in slide-in-from-bottom-4 hover:scale-[1.02]"
        >
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
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

      {/* Live Streaming Configuration & Control Modal */}
      <LiveStreamingModal
        isOpen={isStreamingModalOpen}
        onClose={toggleStreamingModal}
        onStartStreaming={async ({ destinations }) => {
          await startLiveStream({ destinations });
        }}
        onStopStreaming={async (destinationId) => {
          await stopLiveStream(destinationId);
        }}
      />

      {/* Collaborative Whiteboard Modal */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={toggleWhiteboard}
        onAddElement={sendWhiteboardElement}
        onUpdateElement={sendWhiteboardUpdate}
        onClearBoard={sendWhiteboardClear}
        onFetchState={fetchWhiteboardState}
        remoteElements={whiteboardElements}
      />

      {/* Shared Files & Drag-Drop Panel */}
      <FilesPanel
        meetingId={slug}
        isOpen={isFileShareOpen}
        onClose={toggleFileShare}
        onUploadFile={uploadSharedFile}
        onFetchFiles={fetchSharedFiles}
        onDeleteFile={deleteSharedFile}
        remoteFiles={remoteFiles}
      />

      {/* Notification Center */}
      <NotificationCenter
        userId={currentUser?.id}
        isOpen={isNotificationCenterOpen}
        onClose={toggleNotificationCenter}
        onFetchNotifications={() => fetchNotifications(currentUser?.id)}
        onMarkRead={markNotificationRead}
        remoteNotification={latestNotification}
      />

      {/* Recording Setup & Controller Modal */}
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        onStartCloudRecording={handleStartCloudRecording}
        onStopCloudRecording={handleStopCloudRecording}
        onStartLocalRecording={handleStartLocalRecording}
        onStopLocalRecording={handleStopLocalRecording}
        localDuration={localDuration}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportingTarget(null);
        }}
        reporterId={currentUser?.id || myParticipantId || "guest"}
        meetingId={initialMeeting?.id || slug}
        targetUser={reportingTarget}
      />

      <ControlBar
        onLeave={handleLeave}
        onSendReaction={handleSendReaction}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onOpenScreenShareModal={() => {
          if (useMediaStore.getState().isScreenSharing) {
            stopScreenShare();
          } else {
            setIsScreenShareModalOpen(true);
          }
        }}
        onOpenRecordingModal={() => setIsRecordingModalOpen(true)}
        onOpenLiveStreamingModal={toggleStreamingModal}
        onOpenWhiteboardModal={toggleWhiteboard}
        onOpenFileSharePanel={toggleFileShare}
        onOpenNotificationCenter={() => {
          toggleNotificationCenter();
          setUnreadNotificationsCount(0);
        }}
        onToggleHandRaise={handleToggleHandRaise}
        disableScreenShare={!isHost && meetingSettings.disableScreenShare}
        disableReactions={!isHost && meetingSettings.disableReactions}
        disableChat={!isHost && meetingSettings.disableChat}
        isLocked={meetingSettings.lockMeeting}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />
    </div>
  );
}
