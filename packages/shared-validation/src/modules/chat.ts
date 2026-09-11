import { z } from "zod";

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
