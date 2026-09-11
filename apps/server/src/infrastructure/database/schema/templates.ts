import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { MeetingSettings } from "@meet/shared-types";

export const meetingTemplates = pgTable(
  "meeting_templates",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false).notNull(),
    settings: jsonb("settings").$type<MeetingSettings>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("meeting_templates_user_id_idx").on(table.userId),
    index("meeting_templates_is_default_idx").on(table.isDefault),
  ]
);
