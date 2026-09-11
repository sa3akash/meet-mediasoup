"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";

interface PasskeyButtonProps {
  email?: string;
  onSuccess: (data: any) => void;
  onError?: (err: string) => void;
}

export function PasskeyButton({ email, onSuccess, onError }: PasskeyButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePasskeyAuth = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      // 1. Get authentication options
      const optUrl = email ? `${apiBase}/api/auth/passkeys/auth-options?email=${encodeURIComponent(email)}` : `${apiBase}/api/auth/passkeys/auth-options`;
      const res = await fetch(optUrl);
      const options = await res.json();

      // 2. Trigger browser authenticator (TouchID, FaceID, Windows Hello, Security Key)
      const authResp = await startAuthentication(options);

      // 3. Verify on server
      const verifyRes = await fetch(`${apiBase}/api/auth/passkeys/auth-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResp),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Passkey verification failed");
      }

      onSuccess(verifyData);
    } catch (err: any) {
      console.warn("Passkey auth error:", err);
      onError?.(err.message || "Failed to authenticate with passkey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePasskeyAuth}
      disabled={loading}
      className="w-full py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700/80 border border-white/10 text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all shadow-md hover:border-white/20 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <KeyRound className="w-4 h-4 text-indigo-400" />}
      Sign in with Passkey / WebAuthn
    </button>
  );
}
