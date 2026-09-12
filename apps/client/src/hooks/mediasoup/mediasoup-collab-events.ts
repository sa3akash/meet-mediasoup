import { useMeetingStore } from "../../stores/meeting-store";

export function handleCollabEvent(msg: any, callbacksRef: { [key: string]: any }): boolean {
  switch (msg.event) {
    case "chat:message":
      callbacksRef.onChatMessage?.(msg.data);
      return true;
    case "chat:reacted":
      callbacksRef.onChatReacted?.(msg.data);
      return true;
    case "chat:messageDeleted":
      callbacksRef.onChatMessageDeleted?.(msg.data);
      return true;
    case "chat:messagePinned":
      callbacksRef.onChatMessagePinned?.(msg.data);
      return true;
    case "chat:userMuted":
      callbacksRef.onChatUserMuted?.(msg.data);
      return true;
    case "recording:started":
      callbacksRef.onRecordingStarted?.(msg.data);
      return true;
    case "recording:stopped":
      callbacksRef.onRecordingStopped?.(msg.data);
      return true;
    case "reaction:received":
      if (msg.data?.emoji) callbacksRef.onReactionReceived?.(msg.data.emoji);
      return true;
    case "meeting:settingsUpdated":
      if (msg.data?.settings) callbacksRef.onSettingsUpdated?.(msg.data.settings);
      return true;
    case "poll:new":
      callbacksRef.onPollNew?.(msg.data?.poll);
      return true;
    case "poll:updated":
      callbacksRef.onPollUpdated?.(msg.data?.poll);
      return true;
    case "poll:ended":
      callbacksRef.onPollEnded?.(msg.data?.pollId, msg.data?.poll);
      return true;
    case "breakout:started":
      callbacksRef.onBreakoutStarted?.(msg.data);
      return true;
    case "breakout:broadcast":
      callbacksRef.onBreakoutBroadcast?.(msg.data);
      return true;
    case "breakout:ended":
      callbacksRef.onBreakoutEnded?.();
      return true;
    case "streaming:started":
      useMeetingStore.getState().setLiveStreamingState(true, msg.data?.streams || []);
      callbacksRef.onLiveStreamingStarted?.(msg.data);
      return true;
    case "streaming:stopped":
      useMeetingStore.getState().setLiveStreamingState(false, []);
      callbacksRef.onLiveStreamingStopped?.(msg.data);
      return true;
    case "whiteboard:elementAdded":
      callbacksRef.onWhiteboardElementAdded?.(msg.data);
      return true;
    case "whiteboard:elementUpdated":
      callbacksRef.onWhiteboardElementUpdated?.(msg.data);
      return true;
    case "whiteboard:cleared":
      callbacksRef.onWhiteboardCleared?.();
      return true;
    case "file:uploaded":
      callbacksRef.onFileUploaded?.(msg.data);
      return true;
    case "file:deleted":
      callbacksRef.onFileDeleted?.(msg.data);
      return true;
    case "notification:received":
      callbacksRef.onNotificationReceived?.(msg.data);
      return true;
    default:
      return false;
  }
}
