import { db } from "../../infrastructure/database";
import { meetings } from "../../infrastructure/database/schema";
import { eq, or, and, gte, lte, desc } from "drizzle-orm";

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
   * Format Date to iCalendar / Google UTC string: YYYYMMDDTHHmmssZ
   */
  private formatUtcCompact(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  }

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

  /**
   * Generate Google Calendar Web Intent URL
   */
  generateGoogleCalendarUrl(meeting: any, baseUrl: string = "http://localhost:3000"): string {
    const startDate = meeting.scheduledStartAt ? new Date(meeting.scheduledStartAt) : new Date();
    const endDate = meeting.scheduledEndAt
      ? new Date(meeting.scheduledEndAt)
      : new Date(startDate.getTime() + 45 * 60 * 1000);

    const dates = `${this.formatUtcCompact(startDate)}/${this.formatUtcCompact(endDate)}`;
    const joinUrl = `${baseUrl}/meeting/${meeting.slug}`;
    const passcodeNote = meeting.passcode ? `\nPasscode / PIN: ${meeting.passcode}` : "";
    const details = `${meeting.description || "Enterprise Video Meeting"}\n\nJoin Meeting: ${joinUrl}${passcodeNote}`;

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: meeting.title,
      dates,
      details,
      location: joinUrl,
    });

    if (meeting.recurrenceRule) {
      params.set("recur", `RRULE:${meeting.recurrenceRule}`);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Outlook Calendar Web Intent URL (Personal & Office 365)
   */
  generateOutlookCalendarUrls(meeting: any, baseUrl: string = "http://localhost:3000"): {
    liveUrl: string;
    office365Url: string;
  } {
    const startDate = meeting.scheduledStartAt ? new Date(meeting.scheduledStartAt) : new Date();
    const endDate = meeting.scheduledEndAt
      ? new Date(meeting.scheduledEndAt)
      : new Date(startDate.getTime() + 45 * 60 * 1000);

    const joinUrl = `${baseUrl}/meeting/${meeting.slug}`;
    const passcodeNote = meeting.passcode ? `\nPasscode / PIN: ${meeting.passcode}` : "";
    const body = `${meeting.description || "Enterprise Video Meeting"}\n\nJoin Meeting: ${joinUrl}${passcodeNote}`;

    const params = new URLSearchParams({
      subject: meeting.title,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body,
      location: joinUrl,
    });

    return {
      liveUrl: `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`,
      office365Url: `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`,
    };
  }

  /**
   * Generate RFC 5545 standard .ics file format
   */
  generateIcsContent(meeting: any, baseUrl: string = "http://localhost:3000"): string {
    const startDate = meeting.scheduledStartAt ? new Date(meeting.scheduledStartAt) : new Date();
    const endDate = meeting.scheduledEndAt
      ? new Date(meeting.scheduledEndAt)
      : new Date(startDate.getTime() + 45 * 60 * 1000);

    const nowStr = this.formatUtcCompact(new Date());
    const startStr = this.formatUtcCompact(startDate);
    const endStr = this.formatUtcCompact(endDate);
    const joinUrl = `${baseUrl}/meeting/${meeting.slug}`;
    const passcodeNote = meeting.passcode ? `\\nPasscode / PIN: ${meeting.passcode}` : "";
    const description = `${(meeting.description || "Enterprise Video Meeting").replace(/\n/g, "\\n")}\\n\\nJoin URL: ${joinUrl}${passcodeNote}`;

    const rruleLine = meeting.recurrenceRule ? `RRULE:${meeting.recurrenceRule}\r\n` : "";

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Enterprise Meet Conferencing//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${meeting.id}@meet.enterprise`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      rruleLine ? rruleLine.trim() : null,
      `SUMMARY:${meeting.title.replace(/\n/g, " ")}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${joinUrl}`,
      `URL:${joinUrl}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
  }
}

export const calendarService = new CalendarService();
