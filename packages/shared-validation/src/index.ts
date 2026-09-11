import { z } from "zod";

// Auth Schemas
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});
export type SignUpInput = z.infer<typeof SignUpSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Uppercase required")
    .regex(/[0-9]/, "Digit required"),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// Meeting Settings Schema
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

// Meeting Create & Update Schema
export const CreateMeetingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().max(1000).optional(),
  type: z.enum(["INSTANT", "SCHEDULED", "RECURRING", "PERSONAL"]).default("INSTANT"),
  accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITE_ONLY"]).default("PUBLIC"),
  scheduledStartAt: z.string().datetime().optional(),
  scheduledEndAt: z.string().datetime().optional(),
  recurrenceRule: z.string().optional(),
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

// Chat Message Schema
export const SendMessageSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
  recipientId: z.string().uuid().optional(),
  replyToId: z.string().uuid().optional(),
  content: z.string().min(1, "Message cannot be empty").max(4000),
  messageType: z.enum(["TEXT", "FILE", "SYSTEM", "POLL"]).default("TEXT"),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const MessageReactionSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  emoji: z.string().min(1).max(10),
});
export type MessageReactionInput = z.infer<typeof MessageReactionSchema>;

// Poll Schemas
export const CreatePollSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID"),
  question: z.string().min(5, "Question must be at least 5 characters").max(300),
  options: z
    .array(z.string().min(1, "Option text cannot be empty").max(150))
    .min(2, "Must provide at least 2 options")
    .max(10, "Cannot provide more than 10 options"),
  isAnonymous: z.boolean().default(false),
});
export type CreatePollInput = z.infer<typeof CreatePollSchema>;

export const VotePollSchema = z.object({
  pollId: z.string().uuid("Invalid poll ID"),
  optionIndex: z.number().int().min(0),
});
export type VotePollInput = z.infer<typeof VotePollSchema>;

// User Profile Schemas
export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  presenceStatus: z.enum(["ONLINE", "AWAY", "BUSY", "OFFLINE"]).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const NotificationPreferencesSchema = z.object({
  emailReminders: z.boolean(),
  emailInvites: z.boolean(),
  pushNewMessages: z.boolean(),
  inAppSounds: z.boolean(),
});
export type NotificationPreferencesInput = z.infer<typeof NotificationPreferencesSchema>;
