import { Elysia, t } from "elysia";
import { db } from "../../../infrastructure/database";
import { meetingTemplates, meetings, meetingSettings } from "../../../infrastructure/database/schema";
import { generateUUIDv7, generateMeetingCode } from "@meet/shared-utils";
import { eq, or, desc } from "drizzle-orm";

export const templatesRoutes = new Elysia({ prefix: "/templates" })
  .get("/:userId", async ({ params }) => {
    const list = await db.query.meetingTemplates.findMany({
      where: or(eq(meetingTemplates.userId, params.userId), eq(meetingTemplates.isDefault, true)),
      orderBy: [desc(meetingTemplates.createdAt)],
    });
    return { templates: list };
  })
  .post(
    "/",
    async ({ body }) => {
      const { userId, name, description, settings } = body;
      const id = generateUUIDv7();

      const [template] = await db
        .insert(meetingTemplates)
        .values({
          id,
          userId,
          name,
          description: description || null,
          isDefault: false,
          settings,
        })
        .returning();

      return { template };
    },
    {
      body: t.Object({
        userId: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        settings: t.Any(),
      }),
    }
  )
  .post("/:id/instantiate", async ({ params, body, set }) => {
    const { hostId, title } = body as { hostId: string; title?: string };
    const template = await db.query.meetingTemplates.findFirst({
      where: eq(meetingTemplates.id, params.id),
    });

    if (!template) {
      set.status = 404;
      return { error: "Template not found" };
    }

    const meetingId = generateUUIDv7();
    const slug = generateMeetingCode();

    const [newMeeting] = await db
      .insert(meetings)
      .values({
        id: meetingId,
        hostId,
        title: title || `${template.name} Meeting`,
        slug,
        type: "INSTANT",
        accessLevel: "PUBLIC",
        status: "ACTIVE",
        actualStartAt: new Date(),
      })
      .returning();

    await db.insert(meetingSettings).values({
      id: generateUUIDv7(),
      meetingId: newMeeting.id,
      ...template.settings,
    });

    return { meeting: newMeeting, joinUrl: `/meeting/${newMeeting.slug}` };
  })
  .delete("/:id", async ({ params }) => {
    await db.delete(meetingTemplates).where(eq(meetingTemplates.id, params.id));
    return { success: true };
  });
