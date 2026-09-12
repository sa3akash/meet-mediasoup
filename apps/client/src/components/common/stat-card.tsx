import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badge?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  badge,
  subtitle,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`p-5 rounded-2xl bg-neutral-900/70 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        {badge}
      </div>

      <div className="mt-4">
        <span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
          {trend && (
            <span
              className={`flex items-center text-xs font-semibold ${
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && <p className="text-neutral-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
