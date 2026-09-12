import { db } from "../../../infrastructure/database";
import { meetings, meetingSettings, meetingInvites } from "../../../infrastructure/database/schema";
import { generateUUIDv7, generateMeetingCode } from "@meet/shared-utils";

export interface CreateMeetingInput {
  title: string;
  description?: string;
  type?: string;
  accessLevel?: string;
  passcode?: string;
  inviteEmails?: string[];
  hostId: string;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  recurrenceRule?: string;
  timezone?: string;
  settings?: Record<string, any>;
}

export async function createMeetingWithSettings(input: CreateMeetingInput) {
  const {
    title,
    description,
    type = "INSTANT",
    accessLevel = "PUBLIC",
    passcode,
    inviteEmails,
    hostId,
    scheduledStartAt,
    scheduledEndAt,
    recurrenceRule,
    timezone = "UTC",
    settings,
  } = input;

  const meetingId = generateUUIDv7();
  const slug = generateMeetingCode();

  const [newMeeting] = await db
    .insert(meetings)
    .values({
      id: meetingId,
      hostId,
      title,
      description: description || null,
      slug,
      type,
      accessLevel,
      passcode: passcode || null,
      status: type === "INSTANT" ? "ACTIVE" : "SCHEDULED",
      actualStartAt: type === "INSTANT" ? new Date() : null,
      scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : null,
      recurrenceRule: recurrenceRule || null,
      timezone: timezone || "UTC",
    })
    .returning();

  await db.insert(meetingSettings).values({
    id: generateUUIDv7(),
    meetingId: newMeeting.id,
    waitingRoomEnabled: settings?.waitingRoomEnabled ?? false,
    autoRecording: settings?.autoRecording ?? false,
    muteOnJoin: settings?.muteOnJoin ?? true,
    cameraOffOnJoin: settings?.cameraOffOnJoin ?? false,
    disableScreenShare: settings?.disableScreenShare ?? false,
    disableChat: settings?.disableChat ?? false,
    disableFileShare: settings?.disableFileShare ?? false,
    disableReactions: settings?.disableReactions ?? false,
    lockMeeting: settings?.lockMeeting ?? false,
    allowGuestUsers: settings?.allowGuestUsers ?? true,
    maxParticipants: settings?.maxParticipants ?? 100,
  });

  if (inviteEmails && inviteEmails.length > 0) {
    const expiresAt = scheduledEndAt ? new Date(scheduledEndAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    for (const email of inviteEmails) {
      if (email && email.trim()) {
        await db.insert(meetingInvites).values({
          id: generateUUIDv7(),
          meetingId: newMeeting.id,
          email: email.trim().toLowerCase(),
          invitedBy: hostId,
          role: "PARTICIPANT",
          token: generateUUIDv7().replace(/-/g, ""),
          status: "PENDING",
          expiresAt,
        });
      }
    }
  }

  return {
    meeting: newMeeting,
    joinUrl: `/meeting/${newMeeting.slug}`,
  };
}
