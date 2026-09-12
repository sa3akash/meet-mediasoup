import { db } from "../../../infrastructure/database";
import { meetings } from "../../../infrastructure/database/schema";
import { eq, or } from "drizzle-orm";

export async function findMeeting(idOrSlug: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  return db.query.meetings.findFirst({
    where: isUuid ? or(eq(meetings.id, idOrSlug), eq(meetings.slug, idOrSlug)) : eq(meetings.slug, idOrSlug),
  });
}
