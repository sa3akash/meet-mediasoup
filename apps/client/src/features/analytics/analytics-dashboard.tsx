"use client";

import { useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { AnalyticsKpis } from "./components/analytics-kpis";
import { AnalyticsNetworkCard } from "./components/analytics-network-card";
import { AnalyticsDevicesChart } from "./components/analytics-devices-chart";
import { AnalyticsMeetingsTable } from "./components/analytics-meetings-table";

interface AnalyticsDashboardProps {
  overview: any;
  userId?: string;
}

export function AnalyticsDashboard({ overview, userId: _userId }: AnalyticsDashboardProps) {
  const [data, setData] = useState(overview || {});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/analytics/overview");
      if (res.ok) {
        const json = await res.json();
        if (json.overview) setData(json.overview);
      }
    } catch {
    } finally {
      setIsRefreshing(false);
    }
  };

  const meetings = data.meetings || {};
  const participants = data.participants || {};
  const quality = data.qualityMetrics || {};
  const network = data.networkMetrics || {};
  const recordings = data.recordings || {};
  const deviceBreakdown = data.deviceBreakdown || { counts: {}, percentages: {} };
  const browserBreakdown = data.browserBreakdown || { counts: {}, percentages: {} };
  const recentMeetings = data.recentMeetingsSummary || [];

  return (
    <div className="space-y-8">
      {/* Top Controls & Timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Real-time Telemetry Engine Active</span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <AnalyticsKpis
        meetings={meetings}
        participants={participants}
        quality={quality}
        recordings={recordings}
      />

      {/* Second Row: Detailed Telemetry (Quality & Network Meters) */}
      <AnalyticsNetworkCard quality={quality} network={network} />

      {/* Third Row: Device Types & Browser Distribution */}
      <AnalyticsDevicesChart
        deviceBreakdown={deviceBreakdown}
        browserBreakdown={browserBreakdown}
      />

      {/* Fourth Row: Recent Meeting Performance Logs */}
      <AnalyticsMeetingsTable recentMeetings={recentMeetings} />
    </div>
  );
}
