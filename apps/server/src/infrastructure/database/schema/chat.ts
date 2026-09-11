import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { users } from "./users";

export const meetingChatMessages = pgTable(
  "meeting_chat_messages",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "set null" }), // null for public meeting chat
    replyToId: uuid("reply_to_id"),
    content: text("content").notNull(),
    messageType: varchar("message_type", { length: 20 }).default("TEXT").notNull(), // TEXT, FILE, SYSTEM, POLL
    isPinned: boolean("is_pinned").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_messages_meeting_id_idx").on(table.meetingId),
    index("chat_messages_sender_id_idx").on(table.senderId),
    index("chat_messages_created_at_idx").on(table.createdAt),
  ]
);

export const meetingChatReactions = pgTable(
  "meeting_chat_reactions",
  {
    id: uuid("id").primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => meetingChatMessages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_reactions_message_id_idx").on(table.messageId),
    index("chat_reactions_user_id_idx").on(table.userId),
  ]
);
