import { Check, X } from "lucide-react";

interface PasswordChecklistProps {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

export function PasswordChecklist({
  hasMinLength,
  hasUppercase,
  hasLowercase,
  hasDigit,
  hasSpecial,
}: PasswordChecklistProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-neutral-400">
      <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : ""}`}>
        {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-neutral-600" />}
        8+ characters
      </div>
      <div className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-400" : ""}`}>
        {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-neutral-600" />}
        Uppercase letter
      </div>
      <div className={`flex items-center gap-1.5 ${hasDigit ? "text-emerald-400" : ""}`}>
        {hasDigit ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-neutral-600" />}
        One number
      </div>
      <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-400" : ""}`}>
        {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-neutral-600" />}
        Special character
      </div>
    </div>
  );
}
