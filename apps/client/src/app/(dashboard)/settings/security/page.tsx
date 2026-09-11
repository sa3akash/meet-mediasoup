import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { SecurityCardsContainer } from "../../../../features/security/security-cards-container";

export const metadata: Metadata = {
  title: "Account Security - Meet Enterprise",
  description: "Manage credentials, passkeys (WebAuthn), and active multi-device sessions.",
};

export default function AccountSecurityPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white p-6 md:p-12 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Account Security</h1>
          </div>
          <p className="text-neutral-400 text-sm">
            Manage your credentials, passkeys, and active sessions across multiple devices.
          </p>
        </header>

        <SecurityCardsContainer />
      </div>
    </div>
  );
}
