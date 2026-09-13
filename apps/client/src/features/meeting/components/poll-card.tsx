import React from "react";
import { CheckCircle2, Radio, StopCircle } from "lucide-react";
import { useMeetingStore } from "../../../stores/meeting-store";
import type { PollData } from "../../../hooks/use-mediasoup";

interface PollCardProps {
  poll: PollData;
  isHost: boolean;
  selectedOptionIndex?: number;
  onSelectOption: (idx: number) => void;
  onCastVote: () => void;
  isVoting: boolean;
  onEndPoll: () => void;
}

export function PollCard({
  poll,
  isHost,
  selectedOptionIndex,
  onSelectOption,
  onCastVote,
  isVoting,
  onEndPoll,
}: PollCardProps) {
  const { myParticipantId } = useMeetingStore();
  const votesObj = (poll as any).votes as Record<string, number> | undefined;
  const userPick = poll.userVotedIndex ?? (myParticipantId && votesObj ? votesObj[myParticipantId] : undefined);
  const hasVoted = userPick !== undefined;
  const canVote = poll.isActive && !hasVoted;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${poll.isActive ? "bg-neutral-800/40 border-white/10" : "bg-neutral-900/60 border-white/5 opacity-80"}`}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <h4 className="text-white font-semibold text-sm leading-snug">{poll.question}</h4>
          <span className="text-[10px] text-neutral-400">
            By {poll.createdByName || (poll as any).creatorName || "Host"} • {new Date(poll.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${poll.isActive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-white/10 text-white/50"}`}>
          {poll.isActive ? "Live" : "Closed"}
        </span>
      </div>

      <div className="space-y-2 mt-3">
        {poll.options.map((opt, idx) => {
          const voteCount = Number(opt.votesCount ?? opt.votes ?? 0);
          const total = Number(poll.totalVotes ?? 0);
          const percentage = total > 0 && !isNaN(voteCount) ? Math.round((voteCount / total) * 100) : 0;
          const isUserPick = userPick === idx;

          if (canVote) {
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors text-xs text-white ${
                  selectedOptionIndex === idx ? "bg-indigo-600/15 border-indigo-500 text-white" : "bg-neutral-800/60 border-white/5 hover:bg-neutral-800"
                }`}
              >
                <input
                  type="radio"
                  name={`poll-${poll.id}`}
                  checked={selectedOptionIndex === idx}
                  onChange={() => onSelectOption(idx)}
                  className="w-4 h-4 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="flex-1 font-medium">{opt.text}</span>
              </label>
            );
          }

          return (
            <div key={idx} className="relative overflow-hidden p-2.5 rounded-xl bg-neutral-800/60 border border-white/5 text-xs text-white">
              <div className={`absolute left-0 top-0 bottom-0 rounded-xl ${isUserPick ? "bg-indigo-600/25" : "bg-white/5"}`} style={{ width: `${percentage}%` }} />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isUserPick && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  <span className={`truncate font-medium ${isUserPick ? "text-indigo-300" : "text-white"}`}>{opt.text}</span>
                </div>
                <span className="text-[11px] font-semibold text-white/70 shrink-0">{percentage}% ({voteCount})</span>
              </div>
            </div>
          );
        })}
      </div>

      {canVote && (
        <div className="mt-3 pt-2">
          <button
            onClick={onCastVote}
            disabled={selectedOptionIndex === undefined || isVoting}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isVoting ? "Submitting..." : "Submit Vote"}</span>
          </button>
        </div>
      )}

      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
        <span>{poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}</span>
        {isHost && poll.isActive && (
          <button onClick={() => confirm("End this poll?") && onEndPoll()} className="text-red-400 hover:text-red-300 flex items-center gap-1">
            <StopCircle className="w-3 h-3" /> End Poll
          </button>
        )}
      </div>
    </div>
  );
}
