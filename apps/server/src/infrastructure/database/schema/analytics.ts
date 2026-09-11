import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { meetings } from "./meetings";
import { users } from "./users";

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey(),
    meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventName: varchar("event_name", { length: 100 }).notNull(),
    properties: jsonb("properties").default({}).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("analytics_meeting_id_idx").on(table.meetingId),
    index("analytics_event_name_idx").on(table.eventName),
    index("analytics_timestamp_idx").on(table.timestamp),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    targetType: varchar("target_type", { length: 50 }).notNull(), // USER, MEETING, SETTING, SYSTEM
    targetId: varchar("target_id", { length: 128 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    details: jsonb("details").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedUserId: uuid("reported_user_id").references(() => users.id, { onDelete: "set null" }),
    reportedMeetingId: uuid("reported_meeting_id").references(() => meetings.id, { onDelete: "set null" }),
    reason: text("reason").notNull(),
    category: varchar("category", { length: 50 }).notNull(), // SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, OTHER
    status: varchar("status", { length: 20 }).default("OPEN").notNull(), // OPEN, INVESTIGATING, RESOLVED, DISMISSED
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("reports_status_idx").on(table.status),
    index("reports_reporter_id_idx").on(table.reporterId),
  ]
);
