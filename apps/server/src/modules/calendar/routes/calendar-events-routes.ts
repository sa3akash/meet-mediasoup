import { Elysia, t } from "elysia";
import { calendarService } from "../calendar-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const calendarEventsRoutes = new Elysia()
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
      ...apiDoc({
        tag: SwaggerTags.CALENDAR,
        summary: "List calendar meetings",
        description: "Retrieves scheduled and recurring meetings with time expansion for a date window.",
      }),
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
  .get(
    "/:id/ics",
    async ({ params, set, headers }) => {
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
    },
    apiDoc({
      tag: SwaggerTags.CALENDAR,
      summary: "Export meeting as iCalendar (.ics)",
      description: "Generates an RFC 5545 standard .ics file download for Apple Calendar, Outlook, and Google Calendar.",
    })
  );
