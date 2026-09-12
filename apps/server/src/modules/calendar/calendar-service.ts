import { db } from "../../infrastructure/database";
import { meetings } from "../../infrastructure/database/schema";
import { eq, or, and, gte, lte, desc } from "drizzle-orm";
import {
  generateIcsContent,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrls,
} from "./services/calendar-generators";


export interface CalendarEvent {
  id: string;
  meetingId: string;
  title: string;
  description: string | null;
  slug: string;
  startAt: string;
  endAt: string;
  type: string;
  accessLevel: string;
  hasPasscode: boolean;
  recurrenceRule: string | null;
  isRecurringInstance?: boolean;
  timezone: string;
  joinUrl: string;
}

export class CalendarService {


  /**
   * Retrieve a meeting by UUID or slug
   */
  async getMeeting(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    return await db.query.meetings.findFirst({
      where: isUuid ? eq(meetings.id, idOrSlug) : eq(meetings.slug, idOrSlug),
      with: {
        settings: true,
        host: {
          columns: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Fetch calendar meetings with recurrence expansion
   */
  async getCalendarEvents(options: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    timezone?: string;
    baseUrl?: string;
  }): Promise<CalendarEvent[]> {
    const start = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = options.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const baseUrl = options.baseUrl || "http://localhost:3000";

    const conditions = [];
    if (options.userId) {
      conditions.push(eq(meetings.hostId, options.userId));
    }

    const meetingRecords = await db.query.meetings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(meetings.createdAt)],
    });

    const events: CalendarEvent[] = [];

    for (const m of meetingRecords) {
      if (m.status === "CANCELLED" || m.status === "ENDED") continue;

      const baseStart = m.scheduledStartAt ? new Date(m.scheduledStartAt) : new Date(m.createdAt);
      const durationMs = m.scheduledEndAt
        ? new Date(m.scheduledEndAt).getTime() - baseStart.getTime()
        : 45 * 60 * 1000; // 45 min default duration
      const tz = m.timezone || options.timezone || "UTC";
      const joinUrl = `${baseUrl}/meeting/${m.slug}`;

      // Single scheduled / instant / personal meeting
      if (m.type !== "RECURRING" || !m.recurrenceRule) {
        if (baseStart >= start && baseStart <= end) {
          events.push({
            id: m.id,
            meetingId: m.id,
            title: m.title,
            description: m.description,
            slug: m.slug,
            startAt: baseStart.toISOString(),
            endAt: new Date(baseStart.getTime() + durationMs).toISOString(),
            type: m.type,
            accessLevel: m.accessLevel,
            hasPasscode: Boolean(m.passcode),
            recurrenceRule: null,
            timezone: tz,
            joinUrl,
          });
        }
        continue;
      }

      // Recurring meeting: expand instances based on cadence
      const rrule = m.recurrenceRule.toUpperCase();
      let intervalDays = 7; // default weekly
      if (rrule.includes("FREQ=DAILY")) {
        intervalDays = 1;
      } else if (rrule.includes("FREQ=WEEKLY")) {
        intervalDays = 7;
      } else if (rrule.includes("FREQ=MONTHLY")) {
        intervalDays = 30;
      }

      let currentInstanceStart = new Date(baseStart.getTime());
      let instanceCount = 0;
      const MAX_INSTANCES = 50;

      while (currentInstanceStart <= end && instanceCount < MAX_INSTANCES) {
        if (currentInstanceStart >= start) {
          events.push({
            id: `${m.id}-${currentInstanceStart.getTime()}`,
            meetingId: m.id,
            title: m.title,
            description: m.description,
            slug: m.slug,
            startAt: currentInstanceStart.toISOString(),
            endAt: new Date(currentInstanceStart.getTime() + durationMs).toISOString(),
            type: m.type,
            accessLevel: m.accessLevel,
            hasPasscode: Boolean(m.passcode),
            recurrenceRule: m.recurrenceRule,
            isRecurringInstance: instanceCount > 0,
            timezone: tz,
            joinUrl,
          });
        }

        // Advance to next instance
        currentInstanceStart = new Date(currentInstanceStart.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        instanceCount++;
      }
    }

    // Sort chronologically
    return events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  generateGoogleCalendarUrl(meeting: any, baseUrl: string = "http://localhost:3000"): string {
    return generateGoogleCalendarUrl(meeting, baseUrl);
  }

  generateOutlookCalendarUrls(meeting: any, baseUrl: string = "http://localhost:3000") {
    return generateOutlookCalendarUrls(meeting, baseUrl);
  }

  generateIcsContent(meeting: any, baseUrl: string = "http://localhost:3000"): string {
    return generateIcsContent(meeting, baseUrl);
  }
}

export const calendarService = new CalendarService();

