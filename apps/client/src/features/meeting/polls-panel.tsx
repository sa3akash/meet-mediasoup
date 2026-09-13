"use client";

import { useState } from "react";
import { X, Plus, BarChart3, Boxes } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import type { PollData, BreakoutStateEvent } from "../../hooks/use-mediasoup";
import { CreatePollForm } from "./components/create-poll-form";
import { PollCard } from "./components/poll-card";
import { BreakoutActivityTab } from "./components/breakout-activity-tab";

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
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, number>>({});
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  if (!isActivitiesOpen) return null;

  const handleVote = async (pollId: string) => {
    const idx = selectedVotes[pollId];
    if (idx === undefined) return;
    setVotingPollId(pollId);
    try { await onVotePoll(pollId, idx); } finally { setVotingPollId(null); }
  };

  return (
    <div className="fixed inset-0 md:relative md:inset-auto w-full md:w-80 lg:w-96 h-full bg-neutral-900 border-l border-white/10 flex flex-col z-40 md:z-30 animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-base">Activities</h3>
          {polls.filter((p) => p.isActive).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold">
              {polls.filter((p) => p.isActive).length} active
            </span>
          )}
        </div>
        <button onClick={toggleActivities} className="p-1.5 rounded-lg text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-white/10 bg-neutral-900/50 p-1">
        <button
          onClick={() => setActiveTab("polls")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${
            activeTab === "polls" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> <span>Polls ({polls.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("breakout")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${
            activeTab === "breakout" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
          }`}
        >
          <Boxes className="w-4 h-4" /> <span>Breakout</span>
          {Boolean(breakoutState?.rooms?.length) && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "polls" ? (
          <div className="space-y-4">
            {isHost && (
              !isCreatingPoll ? (
                <button
                  onClick={() => setIsCreatingPoll(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" /> <span>Create a poll</span>
                </button>
              ) : (
                <CreatePollForm onCancel={() => setIsCreatingPoll(false)} onSubmit={onCreatePoll} />
              )
            )}
            {polls.map((poll) => (
              <PollCard
                key={poll.id} poll={poll} isHost={isHost} selectedOptionIndex={selectedVotes[poll.id]}
                onSelectOption={(idx) => setSelectedVotes((prev) => ({ ...prev, [poll.id]: idx }))}
                onCastVote={() => handleVote(poll.id)} isVoting={votingPollId === poll.id} onEndPoll={() => onEndPoll(poll.id)}
              />
            ))}
          </div>
        ) : (
          <BreakoutActivityTab
            currentBreakoutRoom={currentBreakoutRoom} breakoutState={breakoutState} isHost={isHost}
            onOpenBreakoutSetup={onOpenBreakoutSetup} onBroadcastBreakout={onBroadcastBreakout} onEndBreakout={onEndBreakout}
          />
        )}
      </div>
    </div>
  );
}
