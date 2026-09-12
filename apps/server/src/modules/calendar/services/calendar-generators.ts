export function formatUtcCompact(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generates RFC 5545 iCalendar format file content
 */
export function generateIcsContent(meeting: any, baseUrl: string = "http://localhost:3000"): string {
  const now = new Date();
  const dtStamp = formatUtcCompact(now);
  const startAt = meeting.scheduledStartAt ? new Date(meeting.scheduledStartAt) : now;
  const durationMs = meeting.scheduledEndAt
    ? new Date(meeting.scheduledEndAt).getTime() - startAt.getTime()
    : 45 * 60 * 1000;
  const endAt = new Date(startAt.getTime() + durationMs);

  const dtStart = formatUtcCompact(startAt);
  const dtEnd = formatUtcCompact(endAt);
  const joinUrl = `${baseUrl}/meeting/${meeting.slug}`;

  const description = [
    meeting.description || "",
    `\nJoin Meeting: ${joinUrl}`,
    meeting.passcode ? `Passcode: ${meeting.passcode}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meet Platform//Conferencing Calendar 1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${meeting.id}@meet.local`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${meeting.title || "Video Meeting"}`,
    `DESCRIPTION:${description}`,
    `URL:${joinUrl}`,
    `LOCATION:${joinUrl}`,
    meeting.recurrenceRule ? `RRULE:${meeting.recurrenceRule}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

/**
 * Generates 1-Click Add-to Google Calendar web URL
 */
export function generateGoogleCalendarUrl(meeting: any, baseUrl: string = "http://localhost:3000"): string {
  const startAt = meeting.scheduledStartAt ? new Date(meeting.scheduledStartAt) : new Date();
  const durationMs = meeting.scheduledEndAt
    ? new Date(meeting.scheduledEndAt).getTime() - startAt.getTime()
    : 45 * 60 * 1000;
  const endAt = new Date(startAt.getTime() + durationMs);

  const dates = `${formatUtcCompact(startAt)}/${formatUtcCompact(endAt)}`;
  const joinUrl = `${baseUrl}/meeting/${meeting.slug}`;

  const details = [
    meeting.description || "",
    `Join Meeting: ${joinUrl}`,
    meeting.passcode ? `Passcode: ${meeting.passcode}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title || "Video Meeting",
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
 * Generates 1-Click Add-to Outlook Calendar web URLs (Personal Live & Office 365)
 */
export function generateOutlookCalendarUrls(meeting: any, baseUrl: string = "http://localhost:3000"): { liveUrl: string; office365Url: string } {
  const startAt = meeting.scheduledStartAt ? new Date(meeting.scheduledStartAt) : new Date();
  const durationMs = meeting.scheduledEndAt
    ? new Date(meeting.scheduledEndAt).getTime() - startAt.getTime()
    : 45 * 60 * 1000;
  const endAt = new Date(startAt.getTime() + durationMs);

  const joinUrl = `${baseUrl}/meeting/${meeting.slug}`;
  const body = [
    meeting.description || "",
    `Join Meeting: ${joinUrl}`,
    meeting.passcode ? `Passcode: ${meeting.passcode}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const liveParams = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: meeting.title || "Video Meeting",
    startdt: startAt.toISOString(),
    enddt: endAt.toISOString(),
    body,
    location: joinUrl,
  });

  const office365Params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: meeting.title || "Video Meeting",
    startdt: startAt.toISOString(),
    enddt: endAt.toISOString(),
    body,
    location: joinUrl,
  });

  return {
    liveUrl: `https://outlook.live.com/calendar/0/deeplink/compose?${liveParams.toString()}`,
    office365Url: `https://outlook.office.com/calendar/0/deeplink/compose?${office365Params.toString()}`,
  };
}
