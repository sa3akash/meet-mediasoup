"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, BadgeCheck, Loader2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

interface PasskeyItem {
  id: string;
  name: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

interface PasskeysCardProps {
  apiBase: string;
  getAuthHeaders: () => Record<string, string>;
}

export function PasskeysCard({ apiBase, getAuthHeaders }: PasskeysCardProps) {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      const res = await fetch(`${apiBase}/api/auth/passkeys`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setPasskeys(data.passkeys || []);
    } catch (e) {
      console.warn("Error fetching passkeys:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const optRes = await fetch(`${apiBase}/api/auth/passkeys/register-options`, { headers: getAuthHeaders() });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "Failed to get options");

      const regResp = await startRegistration(options);

      const verifyRes = await fetch(`${apiBase}/api/auth/passkeys/register-verify`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: "Security Key", response: regResp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

      fetchPasskeys();
    } catch (err: any) {
      alert(err.message || "Failed to register passkey");
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/api/auth/passkeys/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setPasskeys((prev) => prev.filter((pk) => pk.id !== id));
      }
    } catch (e) {
      console.warn("Error deleting passkey:", e);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-lg font-semibold text-white">Passkeys & Security Keys</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Passwordless biometric sign-in via TouchID, FaceID, or FIDO2 key.</p>
          </div>
        </div>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Passkey
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-500 text-sm py-4">Loading passkeys...</div>
      ) : passkeys.length === 0 ? (
        <div className="text-neutral-500 text-sm py-4 border border-dashed border-white/10 rounded-2xl text-center">
          No passkeys registered yet. Add a passkey for instant, passwordless access.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {passkeys.map((pk) => (
            <div key={pk.id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-800/50 border border-white/5">
              <div className="flex items-center gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-white">{pk.name}</div>
                  <div className="text-xs text-neutral-400">
                    Added on {new Date(pk.createdAt).toLocaleDateString()} • {pk.deviceType}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(pk.id)}
                className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
