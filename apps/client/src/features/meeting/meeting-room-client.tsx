"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PreJoinLobby } from "../lobby/pre-join-lobby";
import { MeetingGrid } from "./meeting-grid";
import { ControlBar } from "./control-bar";
import { PresenterControlDock } from "./presenter-control-dock";
import { useMediasoup } from "../../hooks/use-mediasoup";
import { useMeetingStore } from "../../stores/meeting-store";
import { useMediaStore } from "../../stores/media-store";
import { useMeetingRoomState } from "./hooks/use-meeting-room-state";
import { MeetingModals } from "./components/meeting-modals";
import { MeetingOverlays } from "./components/meeting-overlays";
import { MeetingSidebars } from "./components/meeting-sidebars";

interface MeetingRoomClientProps {
  slug: string;
  initialMeeting?: any;
  currentUser?: any;
}

export function MeetingRoomClient({ slug, initialMeeting, currentUser }: MeetingRoomClientProps) {
  const router = useRouter();
  const state = useMeetingRoomState(currentUser, initialMeeting);

  const {
    isChatOpen, toggleChat, isWhiteboardOpen, toggleWhiteboard, isFileShareOpen, toggleFileShare,
    isStreamingModalOpen, toggleStreamingModal, isNotificationCenterOpen, toggleNotificationCenter,
    isParticipantsListOpen, isHost, setMeeting, reset: resetMeeting, isRecording, recordingType,
    recordingDuration, setPinnedMessage, setChatUserMuted, myParticipantId,
    isHandRaised, setHandRaised,
  } = useMeetingStore();
  const { resetMedia, isScreenSharing } = useMediaStore();

  const isMeetingHost = Boolean((currentUser?.id && initialMeeting?.hostId && currentUser.id === initialMeeting.hostId) || initialMeeting?.isHost || (!initialMeeting?.hostId && !currentUser?.id));

  const soup = useMediasoup(
    slug, state.displayName, currentUser?.id,
    {
      onChatMessage: (msg: any) => {
        state.setMessages((prev) => [...prev, { ...msg, isSelf: false }]);
        if (!isChatOpen) {
          state.setUnreadMessagesCount((prev) => prev + 1);
          state.setLatestMessageToast({
            id: msg.id || crypto.randomUUID(),
            senderName: msg.senderName || "Someone",
            content: msg.content || "",
          });
        }
      },
      onChatReacted: (d: any) => d?.messageId && d?.reactions && state.setMessages((prev) => prev.map((m) => (m.id === d.messageId ? { ...m, reactions: d.reactions } : m))),
      onChatMessageDeleted: (d: any) => d?.messageId && state.setMessages((prev) => prev.filter((m) => m.id !== d.messageId)),
      onReactionReceived: (emoji: string) => state.triggerReaction(emoji),
      onMeetingEnded: () => state.setMeetingEndedModal(true),
      onKicked: (r: string) => state.setKickedReason(r),
      onMediaForced: (e: any) => e.muted ? null : state.setMediaPrompt(e),
      onPollNew: (p: any) => { const poll = p?.poll || p; if (poll?.id) state.setPolls((prev) => [poll, ...prev.filter((x) => x.id !== poll.id)]); },
      onPollUpdated: (p: any) => { const poll = p?.poll || p; if (poll?.id) state.setPolls((prev) => prev.map((x) => (x.id === poll.id ? poll : x))); },
      onPollEnded: (pollId: string, p: any) => { const id = pollId || p?.id; if (id) state.setPolls((prev) => prev.map((x) => (x.id === id ? { ...x, isActive: false, ...(p || {}) } : x))); },
      onBreakoutStarted: (d: any) => state.setBreakoutState(d),
      onBreakoutBroadcast: (d: any) => { state.setBreakoutBroadcastToast(d); setTimeout(() => state.setBreakoutBroadcastToast(null), 6000); },
      onWhiteboardElementAdded: (d: any) => {
        const el = d?.element || d;
        if (el?.id) state.setWhiteboardElements((prev) => [...prev.filter((x) => x.id !== el.id), el]);
      },
      onWhiteboardElementUpdated: (d: any) => {
        const el = d?.element || d;
        if (el?.id) {
          state.setWhiteboardElements((prev) =>
            prev.map((x) => (x.id === el.id ? { ...x, ...el, data: { ...x.data, ...(el.data || {}) } } : x))
          );
        }
      },
      onWhiteboardElementDeleted: (d: any) => {
        const id = d?.elementId || d?.id;
        if (id) {
          state.setWhiteboardElements((prev) => prev.filter((x) => x.id !== id));
        }
      },
      onWhiteboardCleared: () => state.setWhiteboardElements([]),
      onChatMessagePinned: (d: any) => setPinnedMessage(d.isPinned ? d.message : null),
      onChatUserMuted: (d: any) => setChatUserMuted(d.targetParticipantId, d.muted),
    },
    isMeetingHost ? "HOST" : "PARTICIPANT",
    state.hasJoined
  );

  useEffect(() => {
    if (isChatOpen) {
      state.setUnreadMessagesCount(0);
      state.setLatestMessageToast(null);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (initialMeeting) setMeeting({ id: initialMeeting.id, slug: initialMeeting.slug, title: initialMeeting.title || "Meeting", isHost: isMeetingHost });
  }, [initialMeeting, isMeetingHost, setMeeting]);

  useEffect(() => {
    if (state.hasJoined) soup.listPolls().then((res: any) => res?.polls && state.setPolls(res.polls)).catch(() => {});
  }, [state.hasJoined]);

  const currentBreakoutRoom = useMemo(() => {
    if (!state.breakoutState?.rooms || !myParticipantId) return null;
    return state.breakoutState.rooms.find((r: any) => r.participantIds.includes(myParticipantId)) || null;
  }, [state.breakoutState, myParticipantId]);

  const handleLeave = () => { resetMedia(); resetMeeting(); router.push("/meetings"); };

  const handleSendMessage = async (content: string, opts?: any) => {
    const messageId = crypto.randomUUID();
    state.setMessages((prev) => [...prev, { id: messageId, senderName: state.displayName, content, createdAt: new Date().toISOString(), isSelf: true, ...opts }]);
    try { await soup.sendChatMessage(content, { ...opts, id: messageId }); } catch (e: any) { alert(e.message || "Failed to send message"); }
  };

  const handleReactChatMessage = async (messageId: string, emoji: string) => {
    try {
      const res = await soup.reactToChatMessage(messageId, emoji);
      if (res?.reactions) state.setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: res.reactions } : m)));
    } catch {}
  };

  const handleSendReaction = (emoji: string) => {
    state.triggerReaction(emoji);
    soup.sendReaction?.(emoji).catch(() => {});
  };

  const handleToggleHandRaise = () => {
    const next = !isHandRaised;
    setHandRaised(next);
    soup.sendRequest("participant:updateMediaState", { isHandRaised: next }).catch(() => {});
  };

  const handleCreatePoll = async (question: string, options: string[]) => {
    const res = await soup.createPoll(question, options);
    if (res?.poll) state.setPolls((prev) => [res.poll, ...prev.filter((x) => x.id !== res.poll.id)]);
  };

  const handleVotePoll = async (pollId: string, optionIndex: number) => {
    const res = await soup.votePoll(pollId, optionIndex);
    if (res?.poll) state.setPolls((prev) => prev.map((x) => (x.id === pollId ? res.poll : x)));
  };

  const handleEndPoll = async (pollId: string) => {
    await soup.endPoll(pollId);
    state.setPolls((prev) => prev.map((x) => (x.id === pollId ? { ...x, isActive: false } : x)));
  };

  if (!state.hasJoined) {
    return (
      <PreJoinLobby
        meetingTitle={initialMeeting?.title || `Meeting ${slug}`} slug={slug}
        initialDisplayName={state.displayName} userId={currentUser?.id}
        onJoin={(name) => { state.setDisplayName(name); state.setHasJoined(true); }}
      />
    );
  }

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-neutral-950 flex flex-col overflow-hidden select-none">
      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        <MeetingGrid localDisplayName={state.displayName} />
        <MeetingSidebars
          slug={slug} displayName={state.displayName} isChatOpen={isChatOpen} messages={state.messages}
          disableChat={!isHost && state.meetingSettings.disableChat} disableFileShare={!isHost && state.meetingSettings.disableFileShare}
          onSendMessage={handleSendMessage} onReactMessage={handleReactChatMessage} onDeleteMessage={soup.deleteChatMessage}
          onPinMessage={soup.pinChatMessage} onMuteUser={soup.muteChatParticipant} onExportChat={soup.exportMeetingChat}
          isParticipantsListOpen={isParticipantsListOpen} onKickParticipant={soup.kickParticipant} onControlParticipantMedia={soup.controlParticipantMedia}
          onMuteAll={soup.muteAllParticipants} onPromoteParticipant={soup.promoteParticipant} onSpotlightParticipant={soup.spotlightParticipant}
          onReportParticipant={(t) => { state.setReportingTarget(t); state.setIsReportModalOpen(true); }}
          polls={state.polls} breakoutState={state.breakoutState} currentBreakoutRoom={currentBreakoutRoom}
          onCreatePoll={handleCreatePoll} onVotePoll={handleVotePoll} onEndPoll={handleEndPoll}
          onOpenBreakoutSetup={() => state.setIsBreakoutSetupOpen(true)} onBroadcastBreakout={soup.broadcastToBreakoutRooms} onEndBreakout={soup.endBreakoutRooms}
          isFileShareOpen={isFileShareOpen} onCloseFileShare={toggleFileShare} onUploadFile={soup.uploadSharedFile} onDeleteFile={soup.deleteSharedFile} onFetchFiles={soup.fetchSharedFiles}
          isNotificationsOpen={isNotificationCenterOpen} onCloseNotifications={toggleNotificationCenter} currentUserId={currentUser?.id} onFetchNotifications={soup.fetchNotifications} onMarkNotificationRead={soup.markNotificationRead}
        />
      </div>

      <PresenterControlDock onStopShare={soup.stopScreenShare} onPauseShare={soup.pauseScreenShare} onToggleAudio={soup.toggleScreenAudio} />
      <ControlBar
        onLeave={handleLeave} onSendReaction={handleSendReaction} onToggleAudio={soup.toggleAudio}
        onToggleVideo={soup.toggleVideo}
        onToggleScreenShare={isScreenSharing ? soup.stopScreenShare : () => state.setIsScreenShareModalOpen(true)}
        onOpenScreenShareModal={isScreenSharing ? soup.stopScreenShare : () => state.setIsScreenShareModalOpen(true)}
        onToggleHandRaise={handleToggleHandRaise}
        onOpenHostControls={() => state.setIsHostControlsOpen(true)} onOpenRecordingModal={() => state.setIsRecordingModalOpen(true)}
        onOpenLiveStreamingModal={toggleStreamingModal} onOpenWhiteboardModal={toggleWhiteboard}
        onOpenFileSharePanel={toggleFileShare} onOpenNotificationCenter={toggleNotificationCenter}
        disableScreenShare={!isHost && state.meetingSettings.disableScreenShare} disableReactions={!isHost && state.meetingSettings.disableReactions}
        disableChat={!isHost && state.meetingSettings.disableChat} unreadMessagesCount={state.unreadMessagesCount} unreadNotificationsCount={0}
      />

      <MeetingModals
        slug={slug} initialMeeting={initialMeeting} meetingSettings={state.meetingSettings} isHost={isHost}
        isHostControlsOpen={state.isHostControlsOpen} setIsHostControlsOpen={state.setIsHostControlsOpen}
        isBreakoutSetupOpen={state.isBreakoutSetupOpen} setIsBreakoutSetupOpen={state.setIsBreakoutSetupOpen}
        isScreenShareModalOpen={state.isScreenShareModalOpen} setIsScreenShareModalOpen={state.setIsScreenShareModalOpen}
        isRecordingModalOpen={state.isRecordingModalOpen} setIsRecordingModalOpen={state.setIsRecordingModalOpen}
        localDuration={state.localDuration} isStreamingModalOpen={isStreamingModalOpen} toggleStreamingModal={toggleStreamingModal}
        isWhiteboardOpen={isWhiteboardOpen} toggleWhiteboard={toggleWhiteboard} isReportModalOpen={state.isReportModalOpen}
        setIsReportModalOpen={state.setIsReportModalOpen} reportingTarget={state.reportingTarget} currentUserId={currentUser?.id}
        onBroadcastSettings={async (s) => soup.sendRequest("meeting:updateSettings", { settings: s })} onEndMeetingForAll={async () => soup.sendRequest("meeting:endForAll")}
        onStartBreakout={soup.startBreakoutRooms} onStartShare={soup.startScreenShare} onStartStreaming={soup.startLiveStream} onStopStreaming={soup.stopLiveStream}
        onAddWhiteboardElement={soup.sendWhiteboardElement}
        onUpdateWhiteboardElement={soup.sendWhiteboardUpdate}
        onDeleteWhiteboardElement={soup.sendWhiteboardDelete}
        onClearWhiteboard={soup.sendWhiteboardClear}
        onFetchWhiteboard={soup.fetchWhiteboardState} remoteWhiteboardElements={state.whiteboardElements} onStartCloudRecording={soup.startCloudRecording}
        onStopCloudRecording={soup.stopCloudRecording} onStartLocalRecording={async () => {}} onStopLocalRecording={async () => {}}
      />

      <MeetingOverlays
        breakoutBroadcastToast={state.breakoutBroadcastToast} setBreakoutBroadcastToast={state.setBreakoutBroadcastToast}
        isRecording={isRecording} recordingType={recordingType} recordingDuration={recordingDuration} localDuration={state.localDuration}
        onOpenRecordingModal={() => state.setIsRecordingModalOpen(true)} currentBreakoutRoom={currentBreakoutRoom}
        latestMessageToast={state.latestMessageToast} setLatestMessageToast={state.setLatestMessageToast}
        isChatOpen={isChatOpen} toggleChat={toggleChat} mediaPrompt={state.mediaPrompt} setMediaPrompt={state.setMediaPrompt}
        toggleAudio={soup.toggleAudio} toggleVideo={soup.toggleVideo} meetingEndedModal={state.meetingEndedModal} kickedReason={state.kickedReason} onLeave={handleLeave}
        floatingReactions={state.floatingReactions}
      />
    </div>
  );
}
