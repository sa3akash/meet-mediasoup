import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings, users } from "../../../infrastructure/database/schema";
import { generateUUIDv7, generateMeetingCode } from "@meet/shared-utils";
import { eq, and } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const personalRoomRoutes = new Elysia({ prefix: "/pmr" })
  /**
   * Get or initialize personal meeting room for user
   */
  .get(
    "/:userId",
    async ({ params, set }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, params.userId),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      let pmr = await db.query.meetings.findFirst({
        where: and(eq(meetings.hostId, params.userId), eq(meetings.type, "PERSONAL")),
        with: { settings: true },
      });

      if (!pmr) {
        const pmrId = generateUUIDv7();
        const slug = `pmr-${params.userId.replace(/-/g, "").slice(0, 9)}`;

        const [created] = await db
          .insert(meetings)
          .values({
            id: pmrId,
            hostId: params.userId,
            title: `${user.name}'s Personal Meeting Room`,
            description: "Permanent meeting room for 1-on-1s and regular office hours.",
            slug,
            type: "PERSONAL",
            accessLevel: "PUBLIC",
            status: "ACTIVE",
          })
          .returning();

        await db.insert(meetingSettings).values({
          id: generateUUIDv7(),
          meetingId: created.id,
          waitingRoomEnabled: true,
          muteOnJoin: true,
          lockMeeting: false,
          allowGuestUsers: true,
        });

        pmr = await db.query.meetings.findFirst({
          where: eq(meetings.id, created.id),
          with: { settings: true },
        });
      }

      return { personalRoom: pmr };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Get personal room",
        description: "Fetches or lazily provisions the user's permanent personal meeting room (PMR).",
      }),
      params: t.Object({ userId: t.String() }),
    }
  )

  /**
   * Regenerate personal meeting room link slug
   */
  .post(
    "/:userId/reset",
    async ({ params, set }) => {
      const newSlug = `pmr-${generateMeetingCode()}`;

      const [updated] = await db
        .update(meetings)
        .set({ slug: newSlug, updatedAt: new Date() })
        .where(and(eq(meetings.hostId, params.userId), eq(meetings.type, "PERSONAL")))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: "Personal meeting room not found" };
      }

      return { personalRoom: updated };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Reset personal room link",
        description: "Regenerates a new friendly URL code slug for the personal meeting room.",
      }),
      params: t.Object({ userId: t.String() }),
    }
  );
