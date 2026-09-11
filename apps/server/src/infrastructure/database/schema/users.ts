import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    passwordHash: text("password_hash"),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    bio: text("bio"),
    timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
    language: varchar("language", { length: 10 }).default("en").notNull(),
    theme: varchar("theme", { length: 20 }).default("system").notNull(),
    presenceStatus: varchar("presence_status", { length: 20 }).default("OFFLINE").notNull(),
    role: varchar("role", { length: 30 }).default("USER").notNull(), // USER, MODERATOR, ADMIN, SUPER_ADMIN
    isVerified: boolean("is_verified").default(false).notNull(),
    bannedAt: timestamp("banned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_presence_idx").on(table.presenceStatus),
    index("users_deleted_at_idx").on(table.deletedAt),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    deviceName: varchar("device_name", { length: 100 }),
    deviceType: varchar("device_type", { length: 50 }),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_refresh_token_idx").on(table.refreshTokenHash),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(), // google, github, microsoft
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("accounts_provider_account_idx").on(table.provider, table.providerAccountId),
    index("accounts_user_id_idx").on(table.userId),
  ]
);

export const passkeys = pgTable(
  "passkeys",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().unique(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").default(0).notNull(),
    deviceType: varchar("device_type", { length: 32 }).notNull(),
    backedUp: boolean("backed_up").default(false).notNull(),
    transports: text("transports"), // Comma-separated or JSON array string
    name: varchar("name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (table) => [
    index("passkeys_user_id_idx").on(table.userId),
    uniqueIndex("passkeys_credential_id_idx").on(table.credentialId),
  ]
);

export const userPresence = pgTable(
  "user_presence",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).default("OFFLINE").notNull(),
    activeMeetingId: uuid("active_meeting_id"),
    socketId: varchar("socket_id", { length: 128 }),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_presence_status_idx").on(table.status),
    index("user_presence_active_meeting_idx").on(table.activeMeetingId),
  ]
);
