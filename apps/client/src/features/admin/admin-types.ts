export type AdminTab =
  | "overview"
  | "users"
  | "meetings"
  | "recordings"
  | "storage"
  | "moderation"
  | "audit";

export interface AdminConsoleProps {
  initialOverview?: any;
  currentUserId?: string;
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDuration(seconds: number) {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}
