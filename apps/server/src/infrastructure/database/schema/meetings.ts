import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").primaryKey(),
    hostId: uuid("host_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 50 }).notNull().unique(), // e.g. "abc-defg-hij"
    type: varchar("type", { length: 20 }).default("INSTANT").notNull(), // INSTANT, SCHEDULED, RECURRING, PERSONAL
    accessLevel: varchar("access_level", { length: 20 }).default("PUBLIC").notNull(), // PUBLIC, PRIVATE, INVITE_ONLY
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
    scheduledEndAt: timestamp("scheduled_end_at", { withTimezone: true }),
    actualStartAt: timestamp("actual_start_at", { withTimezone: true }),
    actualEndAt: timestamp("actual_end_at", { withTimezone: true }),
    status: varchar("status", { length: 20 }).default("SCHEDULED").notNull(), // SCHEDULED, ACTIVE, ENDED, CANCELLED
    recurrenceRule: text("recurrence_rule"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("meetings_slug_idx").on(table.slug),
    index("meetings_host_id_idx").on(table.hostId),
    index("meetings_status_idx").on(table.status),
    index("meetings_scheduled_start_idx").on(table.scheduledStartAt),
  ]
);

export const meetingSettings = pgTable(
  "meeting_settings",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .unique()
      .references(() => meetings.id, { onDelete: "cascade" }),
    waitingRoomEnabled: boolean("waiting_room_enabled").default(false).notNull(),
    autoRecording: boolean("auto_recording").default(false).notNull(),
    muteOnJoin: boolean("mute_on_join").default(true).notNull(),
    cameraOffOnJoin: boolean("camera_off_on_join").default(false).notNull(),
    disableScreenShare: boolean("disable_screen_share").default(false).notNull(),
    disableChat: boolean("disable_chat").default(false).notNull(),
    disableFileShare: boolean("disable_file_share").default(false).notNull(),
    disableReactions: boolean("disable_reactions").default(false).notNull(),
    lockMeeting: boolean("lock_meeting").default(false).notNull(),
    allowGuestUsers: boolean("allow_guest_users").default(true).notNull(),
    maxParticipants: integer("max_participants").default(100).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

export const meetingParticipants = pgTable(
  "meeting_participants",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: varchar("role", { length: 20 }).default("PARTICIPANT").notNull(), // HOST, CO_HOST, PARTICIPANT, GUEST
    isAudioMuted: boolean("is_audio_muted").default(true).notNull(),
    isVideoMuted: boolean("is_video_muted").default(false).notNull(),
    isScreenSharing: boolean("is_screen_sharing").default(false).notNull(),
    isHandRaised: boolean("is_hand_raised").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    connectionStatus: varchar("connection_status", { length: 20 }).default("CONNECTED").notNull(),
  },
  (table) => [
    index("participants_meeting_id_idx").on(table.meetingId),
    index("participants_user_id_idx").on(table.userId),
    index("participants_role_idx").on(table.role),
  ]
);

export const meetingInvites = pgTable(
  "meeting_invites",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("PARTICIPANT").notNull(),
    token: varchar("token", { length: 128 }).notNull().unique(),
    status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, ACCEPTED, DECLINED, EXPIRED
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("invites_meeting_id_idx").on(table.meetingId),
    index("invites_email_idx").on(table.email),
    uniqueIndex("invites_token_idx").on(table.token),
  ]
);

export const meetingWaitingRoom = pgTable(
  "meeting_waiting_room",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    guestIdentifier: varchar("guest_identifier", { length: 100 }),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, ADMITTED, REJECTED
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processedBy: uuid("processed_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("waiting_room_meeting_id_idx").on(table.meetingId),
    index("waiting_room_status_idx").on(table.status),
  ]
);
