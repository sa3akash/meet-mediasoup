import { relations } from "drizzle-orm";
import { users } from "../users";
import { meetings, meetingParticipants } from "../meetings";
import { meetingChatMessages, meetingChatReactions } from "../chat";
import { meetingPolls, pollVotes } from "../polls";
import { breakoutRooms, breakoutParticipants } from "../breakout";
import { whiteboards, whiteboardElements } from "../whiteboards";

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
