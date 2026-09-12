import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings, meetingInvites } from "../../../infrastructure/database/schema";
import { generateUUIDv7 } from "@meet/shared-utils";
import { eq, and } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const accessRoutes = new Elysia()
  /**
   * Get meeting by slug or code
   */
  .get(
    "/code/:slug",
    async ({ params, set }) => {
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
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Get meeting by slug code",
        description: "Fetches meeting details by friendly code slug with auto-provisioning fallback.",
      }),
      params: t.Object({
        slug: t.String(),
      }),
    }
  )

  /**
   * Verify access by passcode or invite
   */
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

      if (meeting.settings?.lockMeeting && !isHost) {
        return { allowed: false, reason: "LOCKED", message: "This meeting is locked by the host" };
      }

      if (meeting.accessLevel === "PRIVATE" && !isHost) {
        if (!passcode || passcode !== meeting.passcode) {
          return { allowed: false, reason: "INVALID_PASSCODE", message: "Passcode is incorrect or required" };
        }
      }

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
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Verify meeting access",
        description: "Validates passcode, waiting room, lock state, and guest list invite status.",
      }),
      params: t.Object({
        slug: t.String(),
      }),
      body: t.Object({
        passcode: t.Optional(t.String()),
        email: t.Optional(t.String()),
        userId: t.Optional(t.String()),
      }),
    }
  );
