import { relations } from "drizzle-orm";
import { users } from "../users";
import { meetings, meetingSettings, meetingParticipants, meetingInvites, meetingWaitingRoom } from "../meetings";
import { meetingChatMessages } from "../chat";
import { meetingRecordings, meetingStreams } from "../recordings";
import { meetingPolls } from "../polls";
import { breakoutRooms, breakoutParticipants } from "../breakout";
import { whiteboards } from "../whiteboards";
import { fileUploads } from "../files";
import { analyticsEvents } from "../analytics";

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

export const meetingRecordingsRelations = relations(meetingRecordings, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingRecordings.meetingId],
    references: [meetings.id],
  }),
}));

export const meetingStreamsRelations = relations(meetingStreams, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingStreams.meetingId],
    references: [meetings.id],
  }),
}));
