"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  BarChart3,
  Boxes,
  Send,
  Radio,
  StopCircle,
  Clock,
  Volume2,
} from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import type { PollData, BreakoutStateEvent } from "../../hooks/use-mediasoup";

interface PollsPanelProps {
  polls: PollData[];
  breakoutState?: BreakoutStateEvent | null;
  currentBreakoutRoom?: { id: string; name: string } | null;
  onCreatePoll: (question: string, options: string[]) => Promise<any>;
  onVotePoll: (pollId: string, optionIndex: number) => Promise<any>;
  onEndPoll: (pollId: string) => Promise<any>;
  onOpenBreakoutSetup?: () => void;
  onBroadcastBreakout?: (message: string) => Promise<any>;
  onEndBreakout?: () => Promise<any>;
}

export function PollsPanel({
  polls,
  breakoutState,
  currentBreakoutRoom,
  onCreatePoll,
  onVotePoll,
  onEndPoll,
  onOpenBreakoutSetup,
  onBroadcastBreakout,
  onEndBreakout,
}: PollsPanelProps) {
  const { isActivitiesOpen, toggleActivities, isHost } = useMeetingStore();
  const [activeTab, setActiveTab] = useState<"polls" | "breakout">("polls");

  // Create Poll Form State
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voting state (local selection per poll before submitting)
  const [selectedVotes, setSelectedVotes] = useState<Record<string, number>>({});
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  // Breakout broadcast message
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (!isActivitiesOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const handleSubmitPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2) return;

    try {
      setIsSubmitting(true);
      await onCreatePoll(cleanQuestion, cleanOptions);
      setQuestion("");
      setOptions(["", ""]);
      setIsCreatingPoll(false);
    } catch (err) {
      console.error("Failed to create poll:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCastVote = async (pollId: string) => {
    const optionIndex = selectedVotes[pollId];
    if (optionIndex === undefined) return;

    try {
      setVotingPollId(pollId);
      await onVotePoll(pollId, optionIndex);
    } catch (err) {
      console.error("Failed to cast vote:", err);
    } finally {
      setVotingPollId(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !onBroadcastBreakout) return;
    try {
      setIsBroadcasting(true);
      await onBroadcastBreakout(broadcastMsg.trim());
      setBroadcastMsg("");
    } catch (err) {
      console.error("Failed to broadcast message:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="w-80 md:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-base">Activities</h3>
          {polls.filter((p) => p.isActive).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold">
              {polls.filter((p) => p.isActive).length} active
            </span>
          )}
        </div>
        <button
          onClick={toggleActivities}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-neutral-900/50 p-1">
        <button
          onClick={() => setActiveTab("polls")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "polls"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Polls ({polls.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("breakout")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === "breakout"
              ? "bg-white/10 text-white shadow-sm"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Breakout Rooms</span>
          {Boolean(breakoutState?.rooms?.length) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "polls" ? (
          <div>
            {/* Create Poll Button / Form */}
            {isHost && (
              <div className="mb-4">
                {!isCreatingPoll ? (
                  <button
                    onClick={() => setIsCreatingPoll(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create a poll</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleSubmitPoll}
                    className="p-4 rounded-2xl bg-neutral-800/80 border border-white/10 space-y-3 shadow-lg animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        New Poll
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingPoll(false)}
                        className="text-white/50 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-white/70 block mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask a question..."
                        required
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-white/70 block">
                        Options
                      </label>
                      {options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(e.target.value, idx)}
                            placeholder={`Option ${idx + 1}`}
                            required
                            className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="p-1 text-white/40 hover:text-red-400 transition-colors"
                              title="Remove option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {options.length < 6 && (
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mt-1"
                        >
                          <Plus className="w-3 h-3" /> Add option
                        </button>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || !question.trim() || options.filter((o) => o.trim()).length < 2}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                      >
                        {isSubmitting ? "Launching..." : "Launch Poll"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Polls List */}
            {polls.length === 0 && !isCreatingPoll ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mx-auto">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-medium">No polls yet</h4>
                <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                  {isHost
                    ? "Start a poll to collect instant votes and feedback from participants in this call."
                    : "No polls have been launched yet. When the host starts a poll, it will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => {
                  const hasVoted = poll.userVotedIndex !== undefined;
                  const canVote = poll.isActive && !hasVoted;
                  const currentSelected = selectedVotes[poll.id];

                  return (
                    <div
                      key={poll.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        poll.isActive
                          ? "bg-neutral-800/40 border-white/10"
                          : "bg-neutral-900/60 border-white/5 opacity-80"
                      }`}
                    >
                      {/* Poll header */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div>
                          <h4 className="text-white font-semibold text-sm leading-snug">
                            {poll.question}
                          </h4>
                          <span className="text-[10px] text-white/40">
                            By {poll.createdByName || "Host"} • {new Date(poll.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                            poll.isActive
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-white/10 text-white/50"
                          }`}
                        >
                          {poll.isActive ? "Live" : "Closed"}
                        </span>
                      </div>

                      {/* Options / Results */}
                      <div className="space-y-2 mt-3">
                        {poll.options.map((opt, idx) => {
                          const percentage =
                            poll.totalVotes > 0
                              ? Math.round((opt.votes / poll.totalVotes) * 100)
                              : 0;
                          const isUserPick = poll.userVotedIndex === idx;

                          if (canVote) {
                            // Interactive Radio Choice
                            return (
                              <label
                                key={idx}
                                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs text-white ${
                                  currentSelected === idx
                                    ? "bg-indigo-600/15 border-indigo-500 text-white"
                                    : "bg-neutral-800/60 border-white/5 hover:bg-neutral-800 hover:border-white/15"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`poll-${poll.id}`}
                                  checked={currentSelected === idx}
                                  onChange={() =>
                                    setSelectedVotes((prev) => ({ ...prev, [poll.id]: idx }))
                                  }
                                  className="w-4 h-4 text-indigo-600 focus:ring-0 cursor-pointer"
                                />
                                <span className="flex-1 font-medium">{opt.text}</span>
                              </label>
                            );
                          }

                          // Result Progress Bar View
                          return (
                            <div
                              key={idx}
                              className="relative overflow-hidden p-2.5 rounded-xl bg-neutral-800/60 border border-white/5 text-xs text-white"
                            >
                              {/* Background Bar */}
                              <div
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-xl ${
                                  isUserPick ? "bg-indigo-600/25" : "bg-white/5"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />

                              <div className="relative flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {isUserPick && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  )}
                                  <span className={`truncate font-medium ${isUserPick ? "text-indigo-300" : "text-white"}`}>
                                    {opt.text}
                                  </span>
                                </div>
                                <span className="text-[11px] font-semibold text-white/70 shrink-0">
                                  {percentage}% ({opt.votes})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Vote Submit Button (if active & haven't voted) */}
                      {canVote && (
                        <div className="mt-3 pt-2">
                          <button
                            onClick={() => handleCastVote(poll.id)}
                            disabled={currentSelected === undefined || votingPollId === poll.id}
                            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                          >
                            <Radio className="w-3.5 h-3.5" />
                            <span>{votingPollId === poll.id ? "Submitting..." : "Submit Vote"}</span>
                          </button>
                        </div>
                      )}

                      {/* Poll Footer */}
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
                        <span>
                          {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
                        </span>
                        {Boolean(isHost && poll.isActive) && (
                          <button
                            onClick={() => {
                              if (confirm("End this poll? No more votes will be accepted.")) {
                                onEndPoll(poll.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            <StopCircle className="w-3.5 h-3.5" />
                            <span>End poll</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Breakout Rooms Tab */
          <div className="space-y-4">
            {currentBreakoutRoom && (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  You are currently in
                </span>
                <h4 className="text-base font-bold text-white">{currentBreakoutRoom.name}</h4>
              </div>
            )}

            {breakoutState && breakoutState.rooms && breakoutState.rooms.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400">
                      Breakout in progress ({breakoutState.rooms.length} rooms)
                    </span>
                  </div>
                  {breakoutState.durationMinutes && (
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{breakoutState.durationMinutes}m</span>
                    </div>
                  )}
                </div>

                {/* Host Broadcast to All Breakout Rooms */}
                {isHost && onBroadcastBreakout && (
                  <form
                    onSubmit={handleSendBroadcast}
                    className="p-3.5 rounded-2xl bg-neutral-800/80 border border-white/10 space-y-2"
                  >
                    <label className="text-[11px] font-semibold text-white/80 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Broadcast to all breakout rooms</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        placeholder="e.g. 2 minutes remaining!"
                        className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={isBroadcasting || !broadcastMsg.trim()}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
                        title="Broadcast message"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Room list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-1">
                    Rooms List
                  </span>
                  {breakoutState.rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 rounded-xl bg-neutral-800/40 border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {room.name}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {room.participantIds.length} participants assigned
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Host End Breakout Button */}
                {Boolean(isHost && onEndBreakout) && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (confirm("End all breakout rooms and return everyone to main room?")) {
                          onEndBreakout?.();
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>End Breakout Rooms</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mx-auto">
                  <Boxes className="w-6 h-6" />
                </div>
                <h4 className="text-white text-sm font-medium">Breakout Rooms</h4>
                <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                  Split participants into smaller group rooms for brainstorming and discussions.
                </p>
                {Boolean(isHost && onOpenBreakoutSetup) && (
                  <div className="pt-2">
                    <button
                      onClick={onOpenBreakoutSetup}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md active:scale-98"
                    >
                      Set up breakout rooms
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
