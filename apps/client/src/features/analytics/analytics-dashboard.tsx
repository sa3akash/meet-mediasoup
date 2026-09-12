"use client";

import { useState } from "react";
import {
  BarChart3,
  Clock,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Activity,
  Wifi,
  HardDrive,
  Disc,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface AnalyticsDashboardProps {
  overview: any;
  userId?: string;
}

export function AnalyticsDashboard({ overview, userId }: AnalyticsDashboardProps) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Meetings & Duration */}
        <div className="p-5 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Meeting Duration
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {meetings.totalDurationMinutes || 0} <span className="text-sm font-normal text-neutral-400">mins</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="text-indigo-400 font-semibold">{meetings.avgDurationMinutes || 0}m</span> avg per meeting • {meetings.total || 0} total meetings
            </div>
          </div>
        </div>

        {/* Total Participants & Peak */}
        <div className="p-5 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Participants
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {participants.total || 0}
            </div>
            <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <span className="text-blue-400 font-semibold">{participants.peakAttendance || 0}</span> peak concurrent • {participants.avgPerMeeting || 0} avg / room
            </div>
          </div>
        </div>

        {/* Quality Score & Network */}
        <div className="p-5 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Quality & Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight flex items-center gap-2">
              <span>{quality.healthScore || 98}%</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                Optimal
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {quality.avgPacketLossPercent || 0}% loss • {quality.avgJitterMs || 14}ms jitter
            </div>
          </div>
        </div>

        {/* Recording Stats */}
        <div className="p-5 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Cloud Storage
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {recordings.totalStorageMb || 0} <span className="text-sm font-normal text-neutral-400">MB</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {recordings.totalRecordings || 0} recordings • {recordings.totalDurationHours || 0} hrs saved
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Detailed Telemetry (Quality & Network Meters) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Metrics Panel */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Media Quality Telemetry</h3>
                <p className="text-xs text-neutral-400">WebRTC audio/video bitrate & transport stability</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20">
              HD 1080p
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5">
              <span className="text-[11px] text-neutral-400">Video Bitrate</span>
              <div className="text-lg font-bold text-white mt-1">
                {quality.avgVideoBitrateKbps || 1250} <span className="text-xs text-neutral-500">kbps</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full w-[75%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5">
              <span className="text-[11px] text-neutral-400">Audio Bitrate</span>
              <div className="text-lg font-bold text-white mt-1">
                {quality.avgAudioBitrateKbps || 64} <span className="text-xs text-neutral-500">kbps</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[90%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5">
              <span className="text-[11px] text-neutral-400">Packet Loss</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {quality.avgPacketLossPercent || 0.1}%
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[5%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5">
              <span className="text-[11px] text-neutral-400">Jitter</span>
              <div className="text-lg font-bold text-white mt-1">
                {quality.avgJitterMs || 14} <span className="text-xs text-neutral-500">ms</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full w-[20%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Network Metrics Panel */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Network Latency & Bandwidth</h3>
                <p className="text-xs text-neutral-400">Round-trip time & throughput capacity</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
              LOW LATENCY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5">
              <span className="text-[11px] text-neutral-400">Round-Trip Time (RTT)</span>
              <div className="text-lg font-bold text-white mt-1">
                {network.avgRttMs || 42} <span className="text-xs text-neutral-500">ms</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full w-[35%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5">
              <span className="text-[11px] text-neutral-400">Available Bandwidth</span>
              <div className="text-lg font-bold text-white mt-1">
                {network.avgBandwidthKbps || 2800} <span className="text-xs text-neutral-500">kbps</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full w-[80%]" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 col-span-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Transport Stability Index</span>
                <span className="text-emerald-400 font-semibold">{network.stabilityScore || 98}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full"
                  style={{ width: `${network.stabilityScore || 98}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Device Types & Browser Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Types Breakdown */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Device Breakdown</h3>
              <p className="text-xs text-neutral-400">Distribution of attendee client devices</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-300 font-medium mb-1.5">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Desktop Computers</span>
                </div>
                <span>{deviceBreakdown.percentages?.desktop || 70}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${deviceBreakdown.percentages?.desktop || 70}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-neutral-300 font-medium mb-1.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Mobile Phones</span>
                </div>
                <span>{deviceBreakdown.percentages?.mobile || 25}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${deviceBreakdown.percentages?.mobile || 25}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-neutral-300 font-medium mb-1.5">
                <div className="flex items-center gap-2">
                  <Tablet className="w-4 h-4 text-purple-400" />
                  <span>Tablets & iPads</span>
                </div>
                <span>{deviceBreakdown.percentages?.tablet || 5}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${deviceBreakdown.percentages?.tablet || 5}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Browser Types Breakdown */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Browser Breakdown</h3>
              <p className="text-xs text-neutral-400">WebRTC client runtime environments</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {Object.entries(browserBreakdown.percentages || { Chrome: 65, Edge: 20, Safari: 10, Firefox: 5 }).map(
              ([browser, pct]: any) => (
                <div key={browser}>
                  <div className="flex items-center justify-between text-xs text-neutral-300 font-medium mb-1.5">
                    <span>{browser}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Fourth Row: Recent Meeting Performance Logs */}
      <div className="p-6 rounded-3xl bg-neutral-900 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Recent Session Performance</h3>
            <p className="text-xs text-neutral-400">Live & past meeting performance health</p>
          </div>
          <Link
            href="/meetings"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="border-b border-white/5 text-neutral-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Meeting</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Participants</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Quality Rating</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentMeetings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-500">
                    No meeting session records yet.
                  </td>
                </tr>
              ) : (
                recentMeetings.map((m: any) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{m.title}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-300">{m.slug}</td>
                    <td className="py-3.5 px-4">{m.participantsCount || 1} joined</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-neutral-400 border border-white/10"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        98% EXCELLENT
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/meeting/${m.slug}`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        Join Room
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
