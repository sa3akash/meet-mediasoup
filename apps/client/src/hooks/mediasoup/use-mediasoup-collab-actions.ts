import { useCallback } from "react";

export function useMediasoupCollabActions(
  sendRequest: (method: string, data?: any) => Promise<any>
) {
  const createPoll = useCallback(
    async (question: string, options: string[]) =>
      sendRequest("poll:create", { question, options }),
    [sendRequest]
  );

  const votePoll = useCallback(
    async (pollId: string, optionIndex: number) =>
      sendRequest("poll:vote", { pollId, optionIndex }),
    [sendRequest]
  );

  const endPoll = useCallback(
    async (pollId: string) => sendRequest("poll:end", { pollId }),
    [sendRequest]
  );

  const listPolls = useCallback(async () => sendRequest("poll:list", {}), [sendRequest]);

  const startBreakoutRooms = useCallback(
    async (
      rooms: Array<{ id: string; name: string; participantIds: string[] }>,
      durationMinutes?: number
    ) => sendRequest("breakout:start", { rooms, durationMinutes }),
    [sendRequest]
  );

  const broadcastToBreakoutRooms = useCallback(
    async (message: string) => sendRequest("breakout:broadcast", { message }),
    [sendRequest]
  );

  const endBreakoutRooms = useCallback(
    async () => sendRequest("breakout:end", {}),
    [sendRequest]
  );

  const sendChatMessage = useCallback(
    async (
      content: string,
      options?: { attachment?: any; replyTo?: any; mentions?: string[]; linkPreview?: any }
    ) =>
      sendRequest("chat:send", {
        content,
        attachment: options?.attachment,
        replyTo: options?.replyTo,
        mentions: options?.mentions,
        linkPreview: options?.linkPreview,
      }),
    [sendRequest]
  );

  const reactToChatMessage = useCallback(
    async (messageId: string, emoji: string) =>
      sendRequest("chat:react", { messageId, emoji }),
    [sendRequest]
  );

  const deleteChatMessage = useCallback(
    async (messageId: string) => sendRequest("chat:delete", { messageId }),
    [sendRequest]
  );

  const pinChatMessage = useCallback(
    async (messageId: string, isPinned: boolean) =>
      sendRequest("chat:pin", { messageId, isPinned }),
    [sendRequest]
  );

  const muteChatParticipant = useCallback(
    async (targetParticipantId: string, muted: boolean) =>
      sendRequest("chat:muteUser", { targetParticipantId, muted }),
    [sendRequest]
  );

  const exportMeetingChat = useCallback(
    async (format: "txt" | "json" = "txt") => sendRequest("chat:export", { format }),
    [sendRequest]
  );

  const sendWhiteboardElement = useCallback(
    async (element: any) => sendRequest("whiteboard:addElement", { element }),
    [sendRequest]
  );

  const sendWhiteboardUpdate = useCallback(
    async (elementId: string, updates: any) =>
      sendRequest("whiteboard:updateElement", { elementId, updates }),
    [sendRequest]
  );

  const sendWhiteboardClear = useCallback(
    async () => sendRequest("whiteboard:clear", {}),
    [sendRequest]
  );

  const fetchWhiteboardState = useCallback(
    async () => sendRequest("whiteboard:state", {}),
    [sendRequest]
  );

  const uploadSharedFile = useCallback(
    async (fileName: string, mimeType: string, base64Data: string) =>
      sendRequest("file:upload", { fileName, mimeType, base64Data }),
    [sendRequest]
  );

  const fetchSharedFiles = useCallback(
    async () => sendRequest("file:list", {}),
    [sendRequest]
  );

  const deleteSharedFile = useCallback(
    async (fileId: string) => sendRequest("file:delete", { fileId }),
    [sendRequest]
  );

  const sendNotificationRpc = useCallback(
    async (notificationData: any) => sendRequest("notification:send", notificationData),
    [sendRequest]
  );

  const fetchNotifications = useCallback(
    async (targetUserId?: string) => sendRequest("notification:list", { userId: targetUserId }),
    [sendRequest]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) =>
      sendRequest("notification:markRead", { notificationId }),
    [sendRequest]
  );

  return {
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
  };
}
