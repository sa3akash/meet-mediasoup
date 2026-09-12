import { Elysia, t } from "elysia";
import { calendarService } from "./calendar-service";

export const calendarRoutes = new Elysia({ prefix: "/api/calendar" })
  /**
   * Get calendar events with recurrence expansion for date range
   */
  .get(
    "/meetings",
    async ({ query, headers }) => {
      const { userId, startDate, endDate, timezone } = query;
      const host = headers["x-forwarded-host"] || headers["host"] || "localhost:3000";
      const proto = headers["x-forwarded-proto"] || "http";
      const baseUrl = `${proto}://${host}`;

      const events = await calendarService.getCalendarEvents({
        userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        timezone,
        baseUrl,
      });

      return { success: true, events, count: events.length };
    },
    {
      query: t.Object({
        userId: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Export meeting as standard RFC 5545 .ics file
   */
  .get("/:id/ics", async ({ params, set, headers }) => {
    const meeting = await calendarService.getMeeting(params.id);
    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }

    const host = headers["x-forwarded-host"] || headers["host"] || "localhost:3000";
    const proto = headers["x-forwarded-proto"] || "http";
    const baseUrl = `${proto}://${host}`;

    const icsString = calendarService.generateIcsContent(meeting, baseUrl);

    set.headers["Content-Type"] = "text/calendar; charset=utf-8";
    set.headers["Content-Disposition"] = `attachment; filename="${meeting.slug || "meeting"}.ics"`;
    return icsString;
  })

  /**
   * Generate Google Calendar 1-click sync URL
   */
  .get("/:id/google-url", async ({ params, set, headers }) => {
    const meeting = await calendarService.getMeeting(params.id);
    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }

    const host = headers["x-forwarded-host"] || headers["host"] || "localhost:3000";
    const proto = headers["x-forwarded-proto"] || "http";
    const baseUrl = `${proto}://${host}`;

    const googleUrl = calendarService.generateGoogleCalendarUrl(meeting, baseUrl);
    return { success: true, url: googleUrl };
  })

  /**
   * Generate Outlook Calendar 1-click sync URLs (Personal Live & Office 365)
   */
  .get("/:id/outlook-url", async ({ params, set, headers }) => {
    const meeting = await calendarService.getMeeting(params.id);
    if (!meeting) {
      set.status = 404;
      return { error: "Meeting not found" };
    }

    const host = headers["x-forwarded-host"] || headers["host"] || "localhost:3000";
    const proto = headers["x-forwarded-proto"] || "http";
    const baseUrl = `${proto}://${host}`;

    const { liveUrl, office365Url } = calendarService.generateOutlookCalendarUrls(meeting, baseUrl);
    return { success: true, liveUrl, office365Url };
  })

  /**
   * Integration endpoint for Google Calendar direct sync
   */
  .post(
    "/sync/google",
    async ({ body, set }) => {
      const { meetingId } = body;
      const meeting = await calendarService.getMeeting(meetingId);
      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }

      const syncUrl = calendarService.generateGoogleCalendarUrl(meeting);
      return {
        success: true,
        provider: "GOOGLE_CALENDAR",
        status: "SYNCED_PENDING_USER_CONFIRMATION",
        syncUrl,
        message: "Google Calendar sync payload prepared successfully.",
      };
    },
    {
      body: t.Object({
        meetingId: t.String(),
      }),
    }
  )

  /**
   * Integration endpoint for Outlook Calendar direct sync
   */
  .post(
    "/sync/outlook",
    async ({ body, set }) => {
      const { meetingId } = body;
      const meeting = await calendarService.getMeeting(meetingId);
      if (!meeting) {
        set.status = 404;
        return { error: "Meeting not found" };
      }

      const { liveUrl, office365Url } = calendarService.generateOutlookCalendarUrls(meeting);
      return {
        success: true,
        provider: "OUTLOOK_CALENDAR",
        status: "SYNCED_PENDING_USER_CONFIRMATION",
        liveUrl,
        office365Url,
        message: "Outlook Calendar sync payload prepared successfully.",
      };
    },
    {
      body: t.Object({
        meetingId: t.String(),
      }),
    }
  );
