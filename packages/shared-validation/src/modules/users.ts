import { z } from "zod";

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
