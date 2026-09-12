"use client";

import { Monitor, Smartphone, Tablet, Globe } from "lucide-react";

interface AnalyticsDevicesChartProps {
  deviceBreakdown: any;
  browserBreakdown: any;
}

export function AnalyticsDevicesChart({
  deviceBreakdown,
  browserBreakdown,
}: AnalyticsDevicesChartProps) {
  const devices = deviceBreakdown || { counts: {}, percentages: {} };
  const browsers = browserBreakdown || { counts: {}, percentages: {} };

  return (
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
              <span>{devices.percentages?.desktop || 70}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${devices.percentages?.desktop || 70}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-neutral-300 font-medium mb-1.5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Mobile Phones</span>
              </div>
              <span>{devices.percentages?.mobile || 25}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${devices.percentages?.mobile || 25}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-neutral-300 font-medium mb-1.5">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-purple-400" />
                <span>Tablets & iPads</span>
              </div>
              <span>{devices.percentages?.tablet || 5}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${devices.percentages?.tablet || 5}%` }}
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
          {Object.entries(browsers.percentages || { Chrome: 65, Edge: 20, Safari: 10, Firefox: 5 }).map(
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
  );
}
