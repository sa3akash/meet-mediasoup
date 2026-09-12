import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetingWaitingRoom } from "../../../infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const waitingRoomRoutes = new Elysia()
  .get(
    "/:id/waiting-room",
    async ({ params }) => {
      const list = await db.query.meetingWaitingRoom.findMany({
        where: and(
          eq(meetingWaitingRoom.meetingId, params.id),
          eq(meetingWaitingRoom.status, "PENDING")
        ),
      });
      return { waitingParticipants: list };
    },
    apiDoc({
      tag: SwaggerTags.MEETINGS,
      summary: "List waiting room participants",
      description: "Returns all participants currently pending admission in the meeting waiting room.",
    })
  )
  .post(
    "/:id/waiting-room/admit",
    async ({ params, body }) => {
      const { waitingId, hostId } = body;
      const [updated] = await db
        .update(meetingWaitingRoom)
        .set({
          status: "ADMITTED",
          processedAt: new Date(),
          processedBy: hostId,
        })
        .where(
          and(
            eq(meetingWaitingRoom.id, waitingId),
            eq(meetingWaitingRoom.meetingId, params.id)
          )
        )
        .returning();

      return { admitted: updated };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Admit participant from waiting room",
        description: "Allows the meeting host or co-host to admit a specific waiting participant.",
      }),
      body: t.Object({
        waitingId: t.String(),
        hostId: t.String(),
      }),
    }
  )
  .post(
    "/:id/waiting-room/reject",
    async ({ params, body }) => {
      const { waitingId, hostId } = body;
      const [updated] = await db
        .update(meetingWaitingRoom)
        .set({
          status: "REJECTED",
          processedAt: new Date(),
          processedBy: hostId,
        })
        .where(
          and(
            eq(meetingWaitingRoom.id, waitingId),
            eq(meetingWaitingRoom.meetingId, params.id)
          )
        )
        .returning();

      return { rejected: updated };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Reject participant from waiting room",
        description: "Rejects and denies entry to a participant currently in the waiting room.",
      }),
      body: t.Object({
        waitingId: t.String(),
        hostId: t.String(),
      }),
    }
  )
  .post(
    "/:id/waiting-room/admit-all",
    async ({ params, body }) => {
      const { hostId } = body as { hostId: string };
      await db
        .update(meetingWaitingRoom)
        .set({
          status: "ADMITTED",
          processedAt: new Date(),
          processedBy: hostId,
        })
        .where(
          and(
            eq(meetingWaitingRoom.meetingId, params.id),
            eq(meetingWaitingRoom.status, "PENDING")
          )
        );

      return { success: true };
    },
    {
      ...apiDoc({
        tag: SwaggerTags.MEETINGS,
        summary: "Admit all waiting participants",
        description: "Batch admits all participants currently waiting to join the meeting room.",
      }),
      body: t.Object({
        hostId: t.String(),
      }),
    }
  );

