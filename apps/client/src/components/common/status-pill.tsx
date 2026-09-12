import React from "react";

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple";

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<StatusVariant, { badge: string; dot: string }> = {
  success: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  warning: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  danger: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
  },
  info: {
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  purple: {
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    dot: "bg-indigo-400",
  },
  neutral: {
    badge: "bg-neutral-800 text-neutral-300 border-white/5",
    dot: "bg-neutral-400",
  },
};

export function StatusPill({
  label,
  variant = "neutral",
  dot = true,
  className = "",
}: StatusPillProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.badge} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
      <span>{label}</span>
    </span>
  );
}
