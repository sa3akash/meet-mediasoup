"use client";

import { useActionState, useState } from "react";
import { UserPlus, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signupAction } from "../../actions/auth.actions";
import { PasswordChecklist } from "./password-checklist";

export function SignupFormClient() {
  const [state, formAction, pending] = useActionState(signupAction, null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Full Name</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Jane Doe"
          className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Email Address</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Password</label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-neutral-800/80 border border-white/10 focus:border-indigo-500 rounded-2xl pl-4 pr-11 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <PasswordChecklist
          hasMinLength={hasMinLength}
          hasUppercase={hasUppercase}
          hasLowercase={hasLowercase}
          hasDigit={hasDigit}
          hasSpecial={hasSpecial}
        />
      </div>

      <button
        type="submit"
        disabled={pending || !isPasswordValid}
        className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 mt-3 flex items-center justify-center gap-2"
      >
        {pending ? "Creating account..." : <>Create Account <UserPlus className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
