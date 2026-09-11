import { relations } from "drizzle-orm";
import { users, sessions, accounts, passkeys, userPresence } from "./users";
import { meetings, meetingSettings, meetingParticipants, meetingInvites, meetingWaitingRoom } from "./meetings";
import { meetingChatMessages, meetingChatReactions } from "./chat";
import { meetingRecordings, meetingStreams } from "./recordings";
import { meetingPolls, pollVotes } from "./polls";
import { breakoutRooms, breakoutParticipants } from "./breakout";
import { whiteboards, whiteboardElements } from "./whiteboards";
import { notifications, notificationPreferences } from "./notifications";
import { fileUploads } from "./files";
import { analyticsEvents, auditLogs, reports } from "./analytics";

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

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  host: one(users, {
    fields: [meetings.hostId],
    references: [users.id],
  }),
  settings: one(meetingSettings, {
    fields: [meetings.id],
    references: [meetingSettings.meetingId],
  }),
  participants: many(meetingParticipants),
  invites: many(meetingInvites),
  waitingRoom: many(meetingWaitingRoom),
  chatMessages: many(meetingChatMessages),
  recordings: many(meetingRecordings),
  streams: many(meetingStreams),
  polls: many(meetingPolls),
  breakoutRooms: many(breakoutRooms),
  whiteboards: many(whiteboards),
  fileUploads: many(fileUploads),
  analytics: many(analyticsEvents),
}));

export const meetingSettingsRelations = relations(meetingSettings, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingSettings.meetingId],
    references: [meetings.id],
  }),
}));

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [meetingParticipants.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [meetingParticipants.userId],
    references: [users.id],
  }),
  breakoutAssignments: many(breakoutParticipants),
}));

export const meetingChatMessagesRelations = relations(meetingChatMessages, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [meetingChatMessages.meetingId],
    references: [meetings.id],
  }),
  sender: one(users, {
    fields: [meetingChatMessages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [meetingChatMessages.recipientId],
    references: [users.id],
  }),
  reactions: many(meetingChatReactions),
}));

export const meetingChatReactionsRelations = relations(meetingChatReactions, ({ one }) => ({
  message: one(meetingChatMessages, {
    fields: [meetingChatReactions.messageId],
    references: [meetingChatMessages.id],
  }),
  user: one(users, {
    fields: [meetingChatReactions.userId],
    references: [users.id],
  }),
}));

export const meetingPollsRelations = relations(meetingPolls, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [meetingPolls.meetingId],
    references: [meetings.id],
  }),
  creator: one(users, {
    fields: [meetingPolls.createdBy],
    references: [users.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(meetingPolls, {
    fields: [pollVotes.pollId],
    references: [meetingPolls.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}));

export const breakoutRoomsRelations = relations(breakoutRooms, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [breakoutRooms.meetingId],
    references: [meetings.id],
  }),
  participants: many(breakoutParticipants),
}));

export const breakoutParticipantsRelations = relations(breakoutParticipants, ({ one }) => ({
  room: one(breakoutRooms, {
    fields: [breakoutParticipants.breakoutRoomId],
    references: [breakoutRooms.id],
  }),
  participant: one(meetingParticipants, {
    fields: [breakoutParticipants.participantId],
    references: [meetingParticipants.id],
  }),
}));

export const whiteboardsRelations = relations(whiteboards, ({ one, many }) => ({
  meeting: one(meetings, {
    fields: [whiteboards.meetingId],
    references: [meetings.id],
  }),
  elements: many(whiteboardElements),
}));

export const whiteboardElementsRelations = relations(whiteboardElements, ({ one }) => ({
  whiteboard: one(whiteboards, {
    fields: [whiteboardElements.whiteboardId],
    references: [whiteboards.id],
  }),
  creator: one(users, {
    fields: [whiteboardElements.createdBy],
    references: [users.id],
  }),
}));
