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

export const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT / BST)" },
  { value: "Europe/Paris", label: "Paris, Berlin, Amsterdam (CET)" },
  { value: "Asia/Dubai", label: "Dubai, Abu Dhabi (GST)" },
  { value: "Asia/Dhaka", label: "Dhaka (BST / UTC+6)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Singapore", label: "Singapore, Beijing (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo, Seoul (JST)" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne (AEST)" },
];
