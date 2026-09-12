import { Elysia } from "elysia";
import { notificationService } from "./notification-service";
import { sendToParticipant, participantSockets } from "../signaling/socket-registry";

export const notificationRoutes = new Elysia({ prefix: "/api/notifications" })
  .get("/:userId", async ({ params: { userId } }) => {
    const notifications = await notificationService.listNotifications(userId);
    return { success: true, notifications };
  })
  .post("/:userId/:notificationId/read", async ({ params: { userId, notificationId } }) => {
    const success = await notificationService.markAsRead(userId, notificationId);
    return { success };
  })
  .post("/send", async ({ body, set }) => {
    try {
      const { userId, userEmail, type, title, message, body: bodyText, meetingId, metadata, channels } = body as any;
      const notificationBody = message || bodyText;
      if (!userId || !type || !title || !notificationBody) {
        set.status = 400;
        return { error: "Missing required notification fields" };
      }

      const notif = await notificationService.sendNotification({
        userId,
        userEmail,
        type,
        title,
        body: notificationBody,
        data: metadata,
        channels,
      });

      // If user is connected via socket, notify them directly
      for (const [pid, socket] of participantSockets.entries()) {
        if (socket.data.userId === userId && socket.readyState === 1) {
          sendToParticipant(pid, {
            event: "notification:received",
            data: { notification: notif },
          });
        }
      }

      return { success: true, notification: notif };
    } catch (err: any) {
      set.status = 500;
      return { error: err.message || "Failed to send notification" };
    }
  });
