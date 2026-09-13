"use client";

import { Clock } from "lucide-react";

interface BreakoutConfigControlsProps {
  roomCount: number;
  duration: number;
  onChangeRoomCount: (count: number) => void;
  onChangeDuration: (duration: number) => void;
}

export function BreakoutConfigControls({
  roomCount,
  duration,
  onChangeRoomCount,
  onChangeDuration,
}: BreakoutConfigControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-semibold text-white/80 block mb-1.5">
          Number of Rooms
        </label>
        <select
          value={roomCount}
          onChange={(e) => onChangeRoomCount(Number(e.target.value))}
          className="w-full bg-neutral-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {[2, 3, 4, 5, 6, 8, 10].map((num) => (
            <option key={num} value={num}>
              {num} Rooms
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-white/80 block mb-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Duration</span>
        </label>
        <select
          value={duration}
          onChange={(e) => onChangeDuration(Number(e.target.value))}
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
  );
}
