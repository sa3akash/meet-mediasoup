import { z } from "zod";

export const MeetingSettingsSchema = z.object({
  waitingRoomEnabled: z.boolean().default(false),
  autoRecording: z.boolean().default(false),
  muteOnJoin: z.boolean().default(true),
  cameraOffOnJoin: z.boolean().default(false),
  disableScreenShare: z.boolean().default(false),
  disableChat: z.boolean().default(false),
  disableFileShare: z.boolean().default(false),
  disableReactions: z.boolean().default(false),
  lockMeeting: z.boolean().default(false),
  allowGuestUsers: z.boolean().default(true),
  maxParticipants: z.number().int().min(2).max(1000).default(100),
});
export type MeetingSettingsInput = z.infer<typeof MeetingSettingsSchema>;

export const CreateMeetingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(1000).optional(),
  type: z.enum(["INSTANT", "SCHEDULED", "RECURRING", "PERSONAL"]).default("INSTANT"),
  accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]).default("PUBLIC"),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
  recurrenceRule: z.string().optional(), // e.g. "FREQ=DAILY;INTERVAL=1"
  templateId: z.string().uuid().optional(),
  settings: MeetingSettingsSchema.optional(),
});
export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;

export const UpdateMeetingSchema = CreateMeetingSchema.partial();
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;

export const JoinMeetingSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  passcode: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
export type JoinMeetingInput = z.infer<typeof JoinMeetingSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required").max(100),
  description: z.string().max(500).optional(),
  settings: MeetingSettingsSchema,
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

export const LockMeetingSchema = z.object({
  locked: z.boolean(),
});
export type LockMeetingInput = z.infer<typeof LockMeetingSchema>;
