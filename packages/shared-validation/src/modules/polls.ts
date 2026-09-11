import { z } from "zod";

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
