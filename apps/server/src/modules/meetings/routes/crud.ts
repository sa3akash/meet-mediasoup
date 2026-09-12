import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings, meetingInvites } from "../../../infrastructure/database/schema";
import { generateUUIDv7, generateMeetingCode } from "@meet/shared-utils";
import { eq, desc, and } from "drizzle-orm";

export const crudRoutes = new Elysia()
  .post(
    "/",
    async ({ body, set }) => {
      const {
        title,
        description,
        type = "INSTANT",
        accessLevel = "PUBLIC",
        passcode,
        inviteEmails,
        hostId,
        scheduledStartAt,
        scheduledEndAt,
        recurrenceRule,
        timezone = "UTC",
        settings,
      } = body;

      const meetingId = generateUUIDv7();
      const slug = generateMeetingCode();

      const [newMeeting] = await db
        .insert(meetings)
        .values({
          id: meetingId,
          hostId,
          title,
          description: description || null,
          slug,
          type,
          accessLevel,
          passcode: passcode || null,
          status: type === "INSTANT" ? "ACTIVE" : "SCHEDULED",
          actualStartAt: type === "INSTANT" ? new Date() : null,
          scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
          scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null,
          recurrenceRule: recurrenceRule || null,
          timezone: timezone || "UTC",
        })
        .returning();

      await db.insert(meetingSettings).values({
        id: generateUUIDv7(),
        meetingId: newMeeting.id,
        waitingRoomEnabled: settings?.waitingRoomEnabled ?? false,
        autoRecording: settings?.autoRecording ?? false,
        muteOnJoin: settings?.muteOnJoin ?? true,
        cameraOffOnJoin: settings?.cameraOffOnJoin ?? false,
        disableScreenShare: settings?.disableScreenShare ?? false,
        disableChat: settings?.disableChat ?? false,
        disableFileShare: settings?.disableFileShare ?? false,
        disableReactions: settings?.disableReactions ?? false,
        lockMeeting: settings?.lockMeeting ?? false,
        allowGuestUsers: settings?.allowGuestUsers ?? true,
        maxParticipants: settings?.maxParticipants ?? 100,
      });

      // Insert invites if specified for INVITE_ONLY or attendee list
      if (inviteEmails && inviteEmails.length > 0) {
        const expiresAt = scheduledEndAt ? new Date(scheduledEndAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        for (const email of inviteEmails) {
          if (email && email.trim()) {
            await db.insert(meetingInvites).values({
              id: generateUUIDv7(),
              meetingId: newMeeting.id,
              email: email.trim().toLowerCase(),
              invitedBy: hostId,
              role: "PARTICIPANT",
              token: generateUUIDv7().replace(/-/g, ""),
              status: "PENDING",
              expiresAt,
            });
          }
        }
      }

      return {
        meeting: newMeeting,
        joinUrl: `/meeting/${newMeeting.slug}`,
      };
    },
    {
      body: t.Object({
        hostId: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        type: t.Optional(t.String()),
        accessLevel: t.Optional(t.String()),
        passcode: t.Optional(t.String()),
        inviteEmails: t.Optional(t.Array(t.String())),
        scheduledStartAt: t.Optional(t.String()),
        scheduledEndAt: t.Optional(t.String()),
        recurrenceRule: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        settings: t.Optional(
          t.Object({
            waitingRoomEnabled: t.Optional(t.Boolean()),
            autoRecording: t.Optional(t.Boolean()),
            muteOnJoin: t.Optional(t.Boolean()),
            cameraOffOnJoin: t.Optional(t.Boolean()),
            disableScreenShare: t.Optional(t.Boolean()),
            disableChat: t.Optional(t.Boolean()),
            disableFileShare: t.Optional(t.Boolean()),
            disableReactions: t.Optional(t.Boolean()),
            lockMeeting: t.Optional(t.Boolean()),
            allowGuestUsers: t.Optional(t.Boolean()),
            maxParticipants: t.Optional(t.Number()),
          })
        ),
      }),
    }
  )
  .get("/code/:slug", async ({ params, set }) => {
    let meeting = await db.query.meetings.findFirst({
      where: eq(meetings.slug, params.slug),
      with: {
        settings: true,
        host: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!meeting) {
      // Auto-provision instant meeting for requested slug in development/ad-hoc mode
      const defaultHost = await db.query.users.findFirst();
      if (defaultHost) {
        const meetingId = generateUUIDv7();
        const [created] = await db
          .insert(meetings)
          .values({
            id: meetingId,
            hostId: defaultHost.id,
            title: `Meeting (${params.slug})`,
            slug: params.slug,
            type: "INSTANT",
            accessLevel: "PUBLIC",
            status: "ACTIVE",
            actualStartAt: new Date(),
          })
          .returning();

        await db.insert(meetingSettings).values({
          id: generateUUIDv7(),
          meetingId: created.id,
          waitingRoomEnabled: false,
          allowGuestUsers: true,
          maxParticipants: 100,
        });

        meeting = await db.query.meetings.findFirst({
          where: eq(meetings.id, created.id),
          with: {
            settings: true,
            host: {
              columns: { id: true, name: true, avatarUrl: true },
            },
          },
        });
      }
    }

    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }
    return { meeting };
  })
  .post(
    "/code/:slug/verify",
    async ({ params, body, set }) => {
      const { passcode, email, userId } = body;
      let meeting = await db.query.meetings.findFirst({
        where: eq(meetings.slug, params.slug),
        with: {
          settings: true,
          host: {
            columns: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      if (!meeting) {
        // Auto-provision instant meeting for requested slug in development/ad-hoc mode
        const defaultHost = await db.query.users.findFirst();
        if (defaultHost) {
          const meetingId = generateUUIDv7();
          const [created] = await db
            .insert(meetings)
            .values({
              id: meetingId,
              hostId: defaultHost.id,
              title: `Meeting (${params.slug})`,
              slug: params.slug,
              type: "INSTANT",
              accessLevel: "PUBLIC",
              status: "ACTIVE",
              actualStartAt: new Date(),
            })
            .returning();

          await db.insert(meetingSettings).values({
            id: generateUUIDv7(),
            meetingId: created.id,
            waitingRoomEnabled: false,
            allowGuestUsers: true,
            maxParticipants: 100,
          });

          meeting = await db.query.meetings.findFirst({
            where: eq(meetings.id, created.id),
            with: {
              settings: true,
              host: {
                columns: { id: true, name: true, avatarUrl: true },
              },
            },
          });
        }
      }

      if (!meeting) {
        set.status = 404;
        return { allowed: false, reason: "NOT_FOUND", message: "Meeting not found" };
      }

      if (meeting.status === "CANCELLED") {
        return { allowed: false, reason: "CANCELLED", message: "This meeting has been cancelled by host" };
      }

      if (meeting.status === "ENDED") {
        return { allowed: false, reason: "ENDED", message: "This meeting has ended" };
      }

      const isHost = userId && meeting.hostId === userId;

      // Check locked meeting
      if (meeting.settings?.lockMeeting && !isHost) {
        return { allowed: false, reason: "LOCKED", message: "This meeting is locked by the host" };
      }

      // Check passcode for PRIVATE meetings
      if (meeting.accessLevel === "PRIVATE" && !isHost) {
        if (!passcode || passcode !== meeting.passcode) {
          return { allowed: false, reason: "INVALID_PASSCODE", message: "Passcode is incorrect or required" };
        }
      }

      // Check invite for INVITE_ONLY meetings
      if (meeting.accessLevel === "INVITE_ONLY" && !isHost) {
        if (!email) {
          return { allowed: false, reason: "EMAIL_REQUIRED", message: "Email is required for invite-only meetings" };
        }

        const invite = await db.query.meetingInvites.findFirst({
          where: and(
            eq(meetingInvites.meetingId, meeting.id),
            eq(meetingInvites.email, email.trim().toLowerCase())
          ),
        });

        if (!invite) {
          return { allowed: false, reason: "NOT_INVITED", message: "You are not on the guest list for this meeting" };
        }
      }

      return {
        allowed: true,
        waitingRoom: !!meeting.settings?.waitingRoomEnabled && !isHost,
        meeting,
      };
    },
    {
      body: t.Object({
        passcode: t.Optional(t.String()),
        email: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
    }
  )
  .get("/user/:userId", async ({ params }) => {
    const list = await db.query.meetings.findMany({
      where: eq(meetings.hostId, params.userId),
      with: { settings: true },
      orderBy: [desc(meetings.createdAt)],
      limit: 30,
    });
    return { meetings: list };
  })
  .delete("/:id", async ({ params }) => {
    await db
      .update(meetings)
      .set({ status: "CANCELLED", deletedAt: new Date() })
      .where(eq(meetings.id, params.id));
    return { success: true };
  });
