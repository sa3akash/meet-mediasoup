"use client";

import { useState, useCallback, useRef } from "react";
import type { Message } from "../../chat/chat-panel";
import type { MediaForcedEvent, PollData, BreakoutStateEvent } from "../../../hooks/use-mediasoup";
import type { WhiteboardElement } from "../../whiteboard/whiteboard-modal";
import type { LocalRecorder } from "../../recording/local-recorder";

export function useMeetingRoomState(currentUser?: any, initialMeeting?: any) {
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.name || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [latestMessageToast, setLatestMessageToast] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState<any>(initialMeeting?.settings || {});
  const [meetingEndedModal, setMeetingEndedModal] = useState(false);
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const [mediaPrompt, setMediaPrompt] = useState<MediaForcedEvent | null>(null);

  // Polls & Breakouts
  const [polls, setPolls] = useState<PollData[]>([]);
  const [breakoutState, setBreakoutState] = useState<BreakoutStateEvent | null>(null);
  const [isBreakoutSetupOpen, setIsBreakoutSetupOpen] = useState(false);
  const [breakoutBroadcastToast, setBreakoutBroadcastToast] = useState<{ message: string; from: string } | null>(null);

  // Screen Share & Moderation Modals
  const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState<{ id: string; name: string } | null>(null);

  // Recordings, Whiteboard, Files
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);
  const localRecorderRef = useRef<LocalRecorder | null>(null);
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<any[]>([]);

  return {
    hasJoined, setHasJoined,
    displayName, setDisplayName,
    messages, setMessages,
    unreadMessagesCount, setUnreadMessagesCount,
    latestMessageToast, setLatestMessageToast,
    activeReaction, setActiveReaction,
    isHostControlsOpen, setIsHostControlsOpen,
    meetingSettings, setMeetingSettings,
    meetingEndedModal, setMeetingEndedModal,
    kickedReason, setKickedReason,
    mediaPrompt, setMediaPrompt,
    polls, setPolls,
    breakoutState, setBreakoutState,
    isBreakoutSetupOpen, setIsBreakoutSetupOpen,
    breakoutBroadcastToast, setBreakoutBroadcastToast,
    isScreenShareModalOpen, setIsScreenShareModalOpen,
    isReportModalOpen, setIsReportModalOpen,
    reportingTarget, setReportingTarget,
    isRecordingModalOpen, setIsRecordingModalOpen,
    localDuration, setLocalDuration,
    localRecorderRef,
    whiteboardElements, setWhiteboardElements,
    remoteFiles, setRemoteFiles,
  };
}
