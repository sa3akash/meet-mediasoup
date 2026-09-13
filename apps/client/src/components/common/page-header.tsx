import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  navTabs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  navTabs,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-neutral-400 text-sm mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {navTabs}
        {actions}
      </div>
    </header>
  );
}
