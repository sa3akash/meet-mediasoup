import type { UserRole, PresenceStatus } from "./enums";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  timezone: string;
  language: string;
  theme: "light" | "dark" | "system";
  presenceStatus: PresenceStatus;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}
