import React from "react";
import { Megaphone, X, PhoneOff, UserX } from "lucide-react";
import type { MediaForcedEvent } from "../../../hooks/use-mediasoup";

interface MeetingOverlaysProps {
  breakoutBroadcastToast: { message: string; from: string } | null;
  setBreakoutBroadcastToast: (t: any) => void;
  isRecording: boolean;
  recordingType?: string | null;
  recordingDuration: number;
  localDuration: number;
  onOpenRecordingModal: () => void;
  currentBreakoutRoom?: { id: string; name: string } | null;
  latestMessageToast: { id: string; senderName: string; content: string } | null;
  setLatestMessageToast: (t: any) => void;
  isChatOpen: boolean;
  toggleChat: () => void;
  mediaPrompt: MediaForcedEvent | null;
  setMediaPrompt: (p: any) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  meetingEndedModal: boolean;
  kickedReason: string | null;
  onLeave: () => void;
  floatingReactions?: Array<{ id: string; emoji: string; x: number }>;
}

export function MeetingOverlays({
  breakoutBroadcastToast,
  setBreakoutBroadcastToast,
  isRecording,
  recordingType,
  recordingDuration,
  localDuration,
  onOpenRecordingModal,
  currentBreakoutRoom,
  latestMessageToast,
  setLatestMessageToast,
  isChatOpen,
  toggleChat,
  mediaPrompt,
  setMediaPrompt,
  toggleAudio,
  toggleVideo,
  meetingEndedModal,
  kickedReason,
  onLeave,
  floatingReactions,
}: MeetingOverlaysProps) {
  const dur = recordingType === "LOCAL" ? localDuration : recordingDuration;
  const mins = Math.floor(dur / 60).toString().padStart(2, "0");
  const secs = (dur % 60).toString().padStart(2, "0");

  return (
    <>
      {breakoutBroadcastToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 max-w-md bg-indigo-600/95 text-white rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
          <Megaphone className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Host Announcement</span>
            <p className="text-xs font-medium truncate">{breakoutBroadcastToast.message}</p>
          </div>
          <button onClick={() => setBreakoutBroadcastToast(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isRecording && (
        <div onClick={onOpenRecordingModal} className="absolute top-4 left-6 z-40 bg-red-950/90 border border-red-500/40 text-white rounded-full px-3.5 py-1.5 shadow-xl flex items-center gap-2 cursor-pointer animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-mono font-bold text-red-300">REC {mins}:{secs}</span>
        </div>
      )}

      {currentBreakoutRoom && (
        <div className="absolute top-4 left-44 z-40 bg-neutral-900/90 border border-indigo-500/30 text-white rounded-2xl px-4 py-2 shadow-xl flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">{currentBreakoutRoom.name}</span>
        </div>
      )}

      {latestMessageToast && !isChatOpen && (
        <div onClick={() => { toggleChat(); setLatestMessageToast(null); }} className="absolute bottom-24 left-6 z-40 max-w-sm bg-neutral-900/95 text-white border border-white/15 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 cursor-pointer">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold block">{latestMessageToast.senderName}</span>
            <p className="text-xs text-neutral-300 line-clamp-2">{latestMessageToast.content}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setLatestMessageToast(null); }} className="text-white/40 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {mediaPrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-base font-bold text-white">Unmute request</h3>
            <p className="text-xs text-neutral-400">{mediaPrompt.by ? `${mediaPrompt.by} has asked you to unmute your ${mediaPrompt.mediaType}.` : `Please turn on your ${mediaPrompt.mediaType}.`}</p>
            <div className="flex gap-3">
              <button onClick={() => setMediaPrompt(null)} className="flex-1 py-2 rounded-xl bg-neutral-800 text-xs text-neutral-300">Cancel</button>
              <button onClick={() => { if (mediaPrompt.mediaType === "audio") toggleAudio(); else toggleVideo(); setMediaPrompt(null); }} className="flex-1 py-2 rounded-xl bg-indigo-600 text-xs text-white">Unmute</button>
            </div>
          </div>
        </div>
      )}

      {(meetingEndedModal || kickedReason) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              {kickedReason ? <UserX className="w-6 h-6" /> : <PhoneOff className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-bold text-white">{kickedReason ? "You Were Removed" : "Meeting Ended"}</h3>
            <p className="text-xs text-neutral-400">{kickedReason || "The meeting has been ended for all participants."}</p>
            <button onClick={onLeave} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold">Return to Home</button>
          </div>
        </div>
      )}

      {Boolean(floatingReactions?.length) &&
        floatingReactions!.map((r) => (
          <div
            key={r.id}
            className="fixed bottom-24 z-50 pointer-events-none select-none animate-float-up text-5xl sm:text-6xl drop-shadow-2xl"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </div>
        ))}
    </>
  );
}
