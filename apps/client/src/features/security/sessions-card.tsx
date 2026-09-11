"use client";

import { useEffect, useState } from "react";
import { Laptop, Smartphone, Tablet, LogOut } from "lucide-react";

interface SessionItem {
  id: string;
  deviceName?: string | null;
  deviceType?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  isCurrent: boolean;
}

interface SessionsCardProps {
  apiBase: string;
  getAuthHeaders: () => Record<string, string>;
}

export function SessionsCard({ apiBase, getAuthHeaders }: SessionsCardProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${apiBase}/api/auth/sessions`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch (e) {
      console.warn("Error fetching sessions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (e) {
      console.warn("Error revoking session:", e);
    }
  };

  const handleRevokeOthers = async () => {
    try {
      const res = await fetch(`${apiBase}/api/auth/sessions/revoke-others`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
      }
    } catch (e) {
      console.warn("Error revoking other sessions:", e);
    }
  };

  const getDeviceIcon = (deviceType?: string | null) => {
    const t = deviceType?.toLowerCase() || "";
    if (t.includes("mobile") || t.includes("phone")) return <Smartphone className="w-5 h-5 text-indigo-400" />;
    if (t.includes("tablet")) return <Tablet className="w-5 h-5 text-indigo-400" />;
    return <Laptop className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Active Sessions & Device History</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Devices currently authenticated with your account.</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={handleRevokeOthers}
            className="px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Revoke All Others
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-neutral-500 text-sm py-4">Loading active devices...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                session.isCurrent
                  ? "bg-indigo-950/30 border-indigo-500/30"
                  : "bg-neutral-800/40 border-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                {getDeviceIcon(session.deviceType)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{session.deviceName || "Web Browser"}</span>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        This Device
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    IP: {session.ipAddress || "Localhost"} • Signed in {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
