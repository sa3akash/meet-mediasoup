"use client";

import { useState, useActionState } from "react";
import { X, Sparkles, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createTemplateAction } from "../../actions/template.actions";
import { MeetingSettingsChecklist } from "./meeting-settings-checklist";

export function CreateTemplateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createTemplateAction, null);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="py-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-2 border border-white/5 transition-all shadow-sm active:scale-95"
      >
        <Plus className="w-3.5 h-3.5 text-indigo-400" />
        <span>New Template</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">Create Meeting Template</h3>
                  <p className="text-neutral-400 text-xs">Save pre-configured settings for quick launches</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await formAction(formData);
                setIsOpen(false);
              }}
              className="flex flex-col gap-4"
            >
              {state?.error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Template Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Design Critique / Sprint Review"
                  className="w-full bg-neutral-950 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="What is this template typically used for?"
                  className="w-full bg-neutral-950 border border-white/10 focus:border-indigo-500 rounded-2xl px-4 py-2 text-white text-xs focus:outline-none resize-none"
                />
              </div>

              <MeetingSettingsChecklist />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-neutral-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {pending ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
