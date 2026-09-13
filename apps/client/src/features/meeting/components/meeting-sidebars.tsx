import React from "react";
import { ChatPanel, type Message } from "../../chat/chat-panel";
import { ParticipantsPanel } from "../participants-panel";
import { PollsPanel } from "../polls-panel";
import { FilesPanel } from "../../files/files-panel";
import { NotificationCenter } from "../../notifications/notification-center";

interface MeetingSidebarsProps {
  slug: string;
  displayName: string;
  isChatOpen: boolean;
  messages: Message[];
  disableChat: boolean;
  disableFileShare: boolean;
  onSendMessage: (msg: string, opts?: any) => void;
  onReactMessage?: (id: string, emoji: string) => void;
  onDeleteMessage?: (id: string) => void;
  onPinMessage?: (id: string, pinned: boolean) => void;
  onMuteUser?: (id: string, muted: boolean) => void;
  onExportChat?: (fmt: "txt" | "json") => void;
  isParticipantsListOpen: boolean;
  onKickParticipant?: (id: string) => void;
  onControlParticipantMedia?: (id: string, type: "audio" | "video", muted: boolean) => void;
  onMuteAll?: () => void;
  onPromoteParticipant?: (id: string, role: "CO_HOST" | "PARTICIPANT") => void;
  onSpotlightParticipant?: (id: string | null) => void;
  onReportParticipant: (target: { id: string; name: string }) => void;
  polls: any[];
  breakoutState: any;
  currentBreakoutRoom: any;
  onCreatePoll: (q: string, opts: string[]) => Promise<any>;
  onVotePoll: (id: string, idx: number) => Promise<any>;
  onEndPoll: (id: string) => Promise<any>;
  onOpenBreakoutSetup: () => void;
  onBroadcastBreakout: (msg: string) => Promise<any>;
  onEndBreakout: () => Promise<any>;
  isFileShareOpen: boolean;
  onCloseFileShare: () => void;
  onUploadFile: (name: string, type: string, b64: string) => Promise<any>;
  onDeleteFile: (id: string) => Promise<any>;
  onFetchFiles: () => Promise<any>;
  isNotificationsOpen: boolean;
  onCloseNotifications: () => void;
  currentUserId?: string;
  onFetchNotifications: () => Promise<any>;
  onMarkNotificationRead: (id: string) => Promise<any>;
}

export function MeetingSidebars(props: MeetingSidebarsProps) {
  return (
    <>
      {props.isChatOpen && (
        <ChatPanel
          messages={props.messages}
          disableChat={props.disableChat}
          disableFileShare={props.disableFileShare}
          onSendMessage={props.onSendMessage}
          onReactMessage={props.onReactMessage}
          onDeleteMessage={props.onDeleteMessage}
          onPinMessage={props.onPinMessage}
          onMuteUser={props.onMuteUser}
          onExportChat={props.onExportChat}
        />
      )}

      {props.isParticipantsListOpen && (
        <ParticipantsPanel
          localDisplayName={props.displayName}
          onKickParticipant={props.onKickParticipant}
          onControlParticipantMedia={props.onControlParticipantMedia}
          onMuteAll={props.onMuteAll}
          onPromoteParticipant={props.onPromoteParticipant}
          onSpotlightParticipant={props.onSpotlightParticipant}
          onReportParticipant={props.onReportParticipant}
        />
      )}

      <PollsPanel
        polls={props.polls}
        breakoutState={props.breakoutState}
        currentBreakoutRoom={props.currentBreakoutRoom}
        onCreatePoll={props.onCreatePoll}
        onVotePoll={props.onVotePoll}
        onEndPoll={props.onEndPoll}
        onOpenBreakoutSetup={props.onOpenBreakoutSetup}
        onBroadcastBreakout={props.onBroadcastBreakout}
        onEndBreakout={props.onEndBreakout}
      />

      <FilesPanel
        meetingId={props.slug}
        isOpen={props.isFileShareOpen}
        onClose={props.onCloseFileShare}
        onUploadFile={props.onUploadFile}
        onDeleteFile={props.onDeleteFile}
        onFetchFiles={props.onFetchFiles}
      />

      <NotificationCenter
        userId={props.currentUserId}
        isOpen={props.isNotificationsOpen}
        onClose={props.onCloseNotifications}
        onFetchNotifications={props.onFetchNotifications}
        onMarkRead={props.onMarkNotificationRead}
      />
    </>
  );
}
