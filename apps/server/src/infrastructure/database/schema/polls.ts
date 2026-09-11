import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { users } from "./users";

export const meetingPolls = pgTable(
  "meeting_polls",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    options: jsonb("options").$type<Array<{ id: string; text: string }>>().notNull(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("polls_meeting_id_idx").on(table.meetingId),
    index("polls_is_active_idx").on(table.isActive),
  ]
);

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => meetingPolls.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("poll_votes_user_idx").on(table.pollId, table.userId),
    index("poll_votes_poll_id_idx").on(table.pollId),
  ]
);
