"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { useResponsive, type ResponsiveState } from "../hooks/use-responsive";

export type MeetingActivePanel =
  | "chat"
  | "participants"
  | "polls"
  | "files"
  | "whiteboard"
  | null;

export interface MeetingContextValue {
  slug: string;
  currentUser?: any;
  initialMeeting?: any;
  activePanel: MeetingActivePanel;
  setActivePanel: (panel: MeetingActivePanel) => void;
  togglePanel: (panel: MeetingActivePanel) => void;
  isHost: boolean;
  responsive: ResponsiveState;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export interface MeetingProviderProps {
  slug: string;
  currentUser?: any;
  initialMeeting?: any;
  isHost?: boolean;
  children: React.ReactNode;
}

export function MeetingProvider({
  slug,
  currentUser,
  initialMeeting,
  isHost = false,
  children,
}: MeetingProviderProps) {
  const [activePanel, setActivePanel] = useState<MeetingActivePanel>(null);
  const responsive = useResponsive();

  const togglePanel = (panel: MeetingActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const value = useMemo(
    () => ({
      slug,
      currentUser,
      initialMeeting,
      activePanel,
      setActivePanel,
      togglePanel,
      isHost,
      responsive,
    }),
    [slug, currentUser, initialMeeting, activePanel, isHost, responsive]
  );

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
}

export function useMeetingContext(): MeetingContextValue {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeetingContext must be used within a MeetingProvider");
  }
  return context;
}
