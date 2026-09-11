import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetingWaitingRoom } from "../../../infrastructure/database/schema";
import { eq, and } from "drizzle-orm";

export const waitingRoomRoutes = new Elysia()
  .get("/:id/waiting-room", async ({ params }) => {
    const list = await db.query.meetingWaitingRoom.findMany({
      where: and(
        eq(meetingWaitingRoom.meetingId, params.id),
        eq(meetingWaitingRoom.status, "PENDING")
      ),
    });
    return { waitingParticipants: list };
  })
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
      body: t.Object({
        waitingId: t.String(),
        hostId: t.String(),
      }),
    }
  )
  .post("/:id/waiting-room/admit-all", async ({ params, body }) => {
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
  });
