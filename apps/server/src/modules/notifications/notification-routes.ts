import { Elysia, t } from "elysia";
import { notificationService } from "./notification-service";
import { sendToParticipant, participantSockets } from "../signaling/socket-registry";
import { apiDoc, SwaggerTags } from "../../infrastructure/swagger/swagger-helpers";

export const notificationRoutes = new Elysia({ prefix: "/api/notifications" })
  .get(
    "/:userId",
    async ({ params: { userId } }) => {
      const notifications = await notificationService.listNotifications(userId);
      return { success: true, notifications };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.NOTIFICATIONS,
        summary: "List user notifications",
        description: "Retrieves list of in-app notifications for a specific user.",
      }),
      params: t.Object({
        userId: t.String(),
      }),
    }
  )
  .post(
    "/:userId/:notificationId/read",
    async ({ params: { userId, notificationId } }) => {
      const success = await notificationService.markAsRead(userId, notificationId);
      return { success };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.NOTIFICATIONS,
        summary: "Mark notification as read",
      }),
      params: t.Object({
        userId: t.String(),
        notificationId: t.String(),
      }),
    }
  )
  .post(
    "/send",
    async ({ body, set }) => {
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
    },
    {
      ...apiDoc({
        tag: SwaggerTags.NOTIFICATIONS,
        summary: "Send multi-channel notification",
        description: "Dispatches email, in-app, or push notification for events like meeting reminders, recordings, or invites.",
      }),
      body: t.Object({
        userId: t.String(),
        userEmail: t.Optional(t.String()),
        type: t.String(),
        title: t.String(),
        message: t.Optional(t.String()),
        body: t.Optional(t.String()),
        meetingId: t.Optional(t.String()),
        metadata: t.Optional(t.Any()),
        channels: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .post(
    "/push-subscribe",
    async ({ body, set }) => {
      try {
        const { userId, subscription } = body as any;
        if (!userId || !subscription) {
          set.status = 400;
          return { error: "Missing userId or subscription" };
        }

        await notificationService.registerPushSubscription(userId, subscription);
        return { success: true, message: "Push subscription registered" };
      } catch (err: any) {
        set.status = 500;
        return { error: err.message || "Failed to register push subscription" };
      }
    },
    {
      ...apiDoc({
        tag: SwaggerTags.NOTIFICATIONS,
        summary: "Register Web Push subscription",
        description: "Registers browser push subscription endpoint and keys for background meeting reminders.",
      }),
      body: t.Object({
        userId: t.String(),
        subscription: t.Any(),
      }),
    }
  );


