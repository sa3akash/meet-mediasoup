import React from "react";
import Link from "next/link";
import { Video, Calendar, BarChart3, ShieldCheck } from "lucide-react";

export type DashboardSection = "meetings" | "calendar" | "analytics" | "admin";

interface DashboardNavProps {
  currentSection: DashboardSection;
  className?: string;
}

const NAV_ITEMS = [
  { id: "meetings" as const, href: "/meetings", label: "Meetings", icon: Video },
  { id: "calendar" as const, href: "/calendar", label: "Calendar", icon: Calendar },
  { id: "analytics" as const, href: "/analytics", label: "Analytics", icon: BarChart3 },
  { id: "admin" as const, href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function DashboardNav({ currentSection, className = "" }: DashboardNavProps) {
  return (
    <nav
      aria-label="Dashboard navigation"
      className={`flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900 border border-white/5 ${className}`}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentSection === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
