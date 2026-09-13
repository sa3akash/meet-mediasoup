"use client";

import { Zap, Wifi } from "lucide-react";

interface AnalyticsNetworkCardProps {
  quality: any;
  network: any;
}

export function AnalyticsNetworkCard({ quality, network }: AnalyticsNetworkCardProps) {
  return (
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
  );
}
