import { Elysia, t } from "elysia";
import { calendarService } from "../calendar-service";
import { apiDoc, SwaggerTags } from "../../../infrastructure/swagger/swagger-helpers";

export const calendarSyncRoutes = new Elysia()
  /**
   * Generate Google Calendar 1-click sync URL
   */
  .get(
    "/:id/google-url",
    async ({ params, set, headers }) => {
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
    },
    apiDoc({
      tag: SwaggerTags.CALENDAR,
      summary: "Generate Google Calendar 1-click URL",
    })
  )

  /**
   * Generate Outlook Calendar 1-click sync URLs (Personal Live & Office 365)
   */
  .get(
    "/:id/outlook-url",
    async ({ params, set, headers }) => {
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
    },
    apiDoc({
      tag: SwaggerTags.CALENDAR,
      summary: "Generate Outlook Calendar 1-click URLs",
    })
  )

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
      ...apiDoc({
        tag: SwaggerTags.CALENDAR,
        summary: "Sync meeting to Google Calendar",
      }),
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
      ...apiDoc({
        tag: SwaggerTags.CALENDAR,
        summary: "Sync meeting to Outlook Calendar",
      }),
      body: t.Object({
        meetingId: t.String(),
      }),
    }
  );
