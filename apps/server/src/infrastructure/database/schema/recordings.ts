import { pgTable, uuid, varchar, text, timestamp, integer, bigint, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { users } from "./users";

export const meetingRecordings = pgTable(
  "meeting_recordings",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    triggeredBy: uuid("triggered_by").references(() => users.id, { onDelete: "set null" }),
    type: varchar("type", { length: 20 }).default("CLOUD").notNull(), // CLOUD, LOCAL
    format: varchar("format", { length: 10 }).default("MP4").notNull(), // MP4, HLS
    fileUrl: text("file_url"),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
    durationSeconds: integer("duration_seconds"),
    status: varchar("status", { length: 20 }).default("INITIALIZING").notNull(), // INITIALIZING, RECORDING, PROCESSING, READY, FAILED
    s3Key: text("s3_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("recordings_meeting_id_idx").on(table.meetingId),
    index("recordings_status_idx").on(table.status),
  ]
);

export const meetingStreams = pgTable(
  "meeting_streams",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    platform: varchar("platform", { length: 30 }).notNull(), // YOUTUBE, FACEBOOK, CUSTOM_RTMP
    rtmpUrl: text("rtmp_url").notNull(),
    streamKey: text("stream_key").notNull(),
    status: varchar("status", { length: 20 }).default("STARTING").notNull(), // STARTING, STREAMING, STOPPED, ERROR
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("streams_meeting_id_idx").on(table.meetingId),
    index("streams_status_idx").on(table.status),
  ]
);
