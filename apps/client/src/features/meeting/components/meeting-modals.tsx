import React from "react";
import { HostControlsModal } from "../../meetings/host-controls-modal";
import { BreakoutRoomsModal } from "../breakout-rooms-modal";
import { ScreenShareModal } from "../screen-share-modal";
import { RecordingModal } from "../../recording/recording-modal";
import { LiveStreamingModal } from "../../streaming/live-streaming-modal";
import { WhiteboardModal } from "../../whiteboard/whiteboard-modal";
import { ReportModal } from "./report-modal";
import { WaitingRoomManager } from "../../meetings/waiting-room-manager";

interface MeetingModalsProps {
  slug: string;
  initialMeeting: any;
  meetingSettings: any;
  isHost: boolean;
  isHostControlsOpen: boolean;
  setIsHostControlsOpen: (open: boolean) => void;
  isBreakoutSetupOpen: boolean;
  setIsBreakoutSetupOpen: (open: boolean) => void;
  isScreenShareModalOpen: boolean;
  setIsScreenShareModalOpen: (open: boolean) => void;
  isRecordingModalOpen: boolean;
  setIsRecordingModalOpen: (open: boolean) => void;
  localDuration: number;
  isStreamingModalOpen: boolean;
  toggleStreamingModal: () => void;
  isWhiteboardOpen: boolean;
  toggleWhiteboard: () => void;
  isReportModalOpen: boolean;
  setIsReportModalOpen: (open: boolean) => void;
  reportingTarget: { id: string; name: string } | null;
  currentUserId?: string;
  onBroadcastSettings: (settings: any) => Promise<any>;
  onEndMeetingForAll: () => Promise<any>;
  onStartBreakout: (rooms: any[], duration?: number) => Promise<any>;
  onStartShare: (options?: any) => Promise<any>;
  onStartStreaming: (data: any) => Promise<any>;
  onStopStreaming: (destId?: string) => Promise<any>;
  onAddWhiteboardElement: (el: any) => Promise<any>;
  onUpdateWhiteboardElement: (id: string, updates: any) => Promise<any>;
  onDeleteWhiteboardElement?: (id: string) => Promise<any>;
  onClearWhiteboard: () => Promise<any>;
  onFetchWhiteboard: () => Promise<any>;
  remoteWhiteboardElements: any[];
  onStartCloudRecording: () => Promise<any>;
  onStopCloudRecording: () => Promise<any>;
  onStartLocalRecording: () => Promise<any>;
  onStopLocalRecording: () => Promise<any>;
}

export function MeetingModals(props: MeetingModalsProps) {
  return (
    <>
      <WaitingRoomManager meetingId={props.slug} hostId={props.initialMeeting?.hostId || ""} />

      <HostControlsModal
        meetingId={props.slug}
        initialLocked={props.meetingSettings.lockMeeting}
        initialSettings={props.meetingSettings}
        initialPasscode={props.initialMeeting?.passcode}
        isOpen={props.isHostControlsOpen}
        onClose={() => props.setIsHostControlsOpen(false)}
        onBroadcastSettings={props.onBroadcastSettings}
        onEndMeetingForAll={props.onEndMeetingForAll}
      />

      <BreakoutRoomsModal
        isOpen={props.isBreakoutSetupOpen}
        onClose={() => props.setIsBreakoutSetupOpen(false)}
        onStartBreakout={props.onStartBreakout}
      />

      <ScreenShareModal
        isOpen={props.isScreenShareModalOpen}
        onClose={() => props.setIsScreenShareModalOpen(false)}
        onStartShare={props.onStartShare}
      />

      <RecordingModal
        isOpen={props.isRecordingModalOpen}
        onClose={() => props.setIsRecordingModalOpen(false)}
        localDuration={props.localDuration}
        onStartCloudRecording={props.onStartCloudRecording}
        onStopCloudRecording={props.onStopCloudRecording}
        onStartLocalRecording={props.onStartLocalRecording}
        onStopLocalRecording={props.onStopLocalRecording}
      />

      <LiveStreamingModal
        isOpen={props.isStreamingModalOpen}
        onClose={props.toggleStreamingModal}
        onStartStreaming={props.onStartStreaming}
        onStopStreaming={props.onStopStreaming}
      />

      <WhiteboardModal
        isOpen={props.isWhiteboardOpen}
        onClose={props.toggleWhiteboard}
        onAddElement={props.onAddWhiteboardElement}
        onUpdateElement={props.onUpdateWhiteboardElement}
        onDeleteElement={props.onDeleteWhiteboardElement}
        onClearBoard={props.onClearWhiteboard}
        onFetchState={props.onFetchWhiteboard}
        remoteElements={props.remoteWhiteboardElements}
      />

      {props.reportingTarget && (
        <ReportModal
          isOpen={props.isReportModalOpen}
          onClose={() => props.setIsReportModalOpen(false)}
          reporterId={props.currentUserId || "anonymous"}
          targetUser={props.reportingTarget}
          meetingId={props.slug}
        />
      )}
    </>
  );
}
