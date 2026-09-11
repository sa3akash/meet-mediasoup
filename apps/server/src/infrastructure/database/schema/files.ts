import { pgTable, uuid, varchar, text, timestamp, bigint, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { users } from "./users";

export const fileUploads = pgTable(
  "file_uploads",
  {
    id: uuid("id").primaryKey(),
    uploaderId: uuid("uploader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: "set null" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    s3Key: text("s3_key").notNull(),
    fileUrl: text("file_url").notNull(),
    scanStatus: varchar("scan_status", { length: 20 }).default("PENDING").notNull(), // PENDING, CLEAN, INFECTED
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("file_uploads_uploader_id_idx").on(table.uploaderId),
    index("file_uploads_meeting_id_idx").on(table.meetingId),
  ]
);
