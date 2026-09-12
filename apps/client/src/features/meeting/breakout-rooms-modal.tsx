"use client";

import { useState, useMemo } from "react";
import { X, Users, Shuffle, Clock, ArrowRight, Boxes } from "lucide-react";
import { useMeetingStore } from "../../stores/meeting-store";
import type { BreakoutRoomInfo } from "../../hooks/use-mediasoup";

interface BreakoutRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBreakout: (
    rooms: BreakoutRoomInfo[],
    durationMinutes?: number
  ) => Promise<any>;
}

export function BreakoutRoomsModal({
  isOpen,
  onClose,
  onStartBreakout,
}: BreakoutRoomsModalProps) {
  const { participants } = useMeetingStore();
  const [roomCount, setRoomCount] = useState(2);
  const [duration, setDuration] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All remote participants + local host
  const participantList = useMemo(() => {
    return Array.from(participants.values());
  }, [participants]);

  // Generate initial rooms distribution
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  // Auto-distribute participants evenly
  const autoAssign = useMemo(() => {
    const res: Record<string, number> = {};
    participantList.forEach((p, idx) => {
      res[p.id] = idx % roomCount;
    });
    return res;
  }, [participantList, roomCount]);

  const activeAssignments = Object.keys(assignments).length > 0 ? assignments : autoAssign;

  const handleStart = async () => {
    try {
      setIsSubmitting(true);
      const rooms: BreakoutRoomInfo[] = [];

      for (let i = 0; i < roomCount; i++) {
        const pids = participantList
          .filter((p) => (activeAssignments[p.id] ?? (participantList.indexOf(p) % roomCount)) === i)
          .map((p) => p.id);

        rooms.push({
          id: `breakout-room-${i + 1}-${Date.now()}`,
          name: `Breakout Room ${i + 1}`,
          participantIds: pids,
        });
      }

      await onStartBreakout(rooms, duration > 0 ? duration : undefined);
      onClose();
    } catch (err) {
      console.error("Failed to start breakout rooms:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShuffle = () => {
    const shuffled: Record<string, number> = {};
    const shuffledList = [...participantList].sort(() => Math.random() - 0.5);
    shuffledList.forEach((p, idx) => {
      shuffled[p.id] = idx % roomCount;
    });
    setAssignments(shuffled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Create Breakout Rooms</h3>
              <p className="text-white/40 text-xs">
                Split {participantList.length} participants into smaller groups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Room Count */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5">
                Number of Rooms
              </label>
              <select
                value={roomCount}
                onChange={(e) => {
                  setRoomCount(Number(e.target.value));
                  setAssignments({});
                }}
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} Rooms
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Duration</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={0}>Unlimited</option>
              </select>
            </div>
          </div>

          {/* Assignment preview header */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-white/80">Room Assignments Preview</span>
            <button
              onClick={handleShuffle}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Rooms Grid */}
          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
            {Array.from({ length: roomCount }).map((_, rIdx) => {
              const assigned = participantList.filter(
                (p) => (activeAssignments[p.id] ?? (participantList.indexOf(p) % roomCount)) === rIdx
              );

              return (
                <div
                  key={rIdx}
                  className="p-3 rounded-2xl bg-neutral-800/50 border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Breakout Room {rIdx + 1}
                    </span>
                    <span className="text-[11px] text-white/50 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {assigned.length} people
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {assigned.length > 0 ? (
                      assigned.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded-lg bg-neutral-900 text-white/80 text-[11px] border border-white/5"
                        >
                          {p.displayName || "Participant"}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-white/30 italic">
                        No participants assigned yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-white/10 bg-neutral-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md active:scale-98"
          >
            <span>{isSubmitting ? "Starting..." : "Start Breakout Rooms"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
