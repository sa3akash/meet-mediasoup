"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useResponsive } from "../../hooks/use-responsive";

interface ResponsiveDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function ResponsiveDrawerModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-lg",
}: ResponsiveDrawerModalProps) {
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative z-10 w-full ${maxWidth} bg-neutral-900 border border-white/10 text-white shadow-2xl flex flex-col max-h-[90vh] ${
          isMobile
            ? "rounded-t-3xl border-b-0 animate-in slide-in-from-bottom duration-300"
            : "rounded-3xl animate-in zoom-in-95 duration-200"
        }`}
      >
        {isMobile && (
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />
        )}

        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">{children}</div>

        {footer && (
          <div className="p-4 border-t border-white/10 bg-neutral-950/40 rounded-b-3xl shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
