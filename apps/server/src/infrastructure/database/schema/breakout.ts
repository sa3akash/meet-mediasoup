import { pgTable, uuid, varchar, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { meetings, meetingParticipants } from "./meetings";

export const breakoutRooms = pgTable(
  "breakout_rooms",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    durationMinutes: integer("duration_minutes").default(15).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("breakout_rooms_meeting_id_idx").on(table.meetingId),
  ]
);

export const breakoutParticipants = pgTable(
  "breakout_participants",
  {
    id: uuid("id").primaryKey(),
    breakoutRoomId: uuid("breakout_room_id")
      .notNull()
      .references(() => breakoutRooms.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => meetingParticipants.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    index("breakout_participants_room_idx").on(table.breakoutRoomId),
    index("breakout_participants_participant_idx").on(table.participantId),
  ]
);
