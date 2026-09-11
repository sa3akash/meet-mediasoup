import { relations } from "drizzle-orm";
import { users, sessions, accounts, passkeys, userPresence } from "../users";
import { meetings, meetingParticipants } from "../meetings";
import { notifications, notificationPreferences } from "../notifications";
import { fileUploads } from "../files";
import { reports } from "../analytics";

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  passkeys: many(passkeys),
  presence: one(userPresence, {
    fields: [users.id],
    references: [userPresence.userId],
  }),
  hostedMeetings: many(meetings),
  participations: many(meetingParticipants),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
  }),
  fileUploads: many(fileUploads),
  reportsSubmitted: many(reports, { relationName: "reporter" }),
  reportsReceived: many(reports, { relationName: "reportedUser" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, {
    fields: [passkeys.userId],
    references: [users.id],
  }),
}));
