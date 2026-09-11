import { pgTable, uuid, varchar, boolean, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { users } from "./users";

export const whiteboards = pgTable(
  "whiteboards",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).default("Untitled Board").notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("whiteboards_meeting_id_idx").on(table.meetingId),
  ]
);

export const whiteboardElements = pgTable(
  "whiteboard_elements",
  {
    id: uuid("id").primaryKey(),
    whiteboardId: uuid("whiteboard_id")
      .notNull()
      .references(() => whiteboards.id, { onDelete: "cascade" }),
    elementId: varchar("element_id", { length: 128 }).notNull(), // Client-assigned unique element UUID
    type: varchar("type", { length: 30 }).notNull(), // DRAW, RECT, CIRCLE, TEXT, STICKY
    data: jsonb("data").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("whiteboard_elements_board_idx").on(table.whiteboardId),
    index("whiteboard_elements_elem_id_idx").on(table.elementId),
  ]
);
