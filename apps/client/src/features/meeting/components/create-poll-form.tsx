import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface CreatePollFormProps {
  onCancel: () => void;
  onSubmit: (question: string, options: string[]) => Promise<any>;
}

export function CreatePollForm({ onCancel, onSubmit }: CreatePollFormProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = question.trim();
    const cleanOpts = options.map((o) => o.trim()).filter(Boolean);
    if (!cleanQ || cleanOpts.length < 2) return;

    try {
      setIsSubmitting(true);
      await onSubmit(cleanQ, cleanOpts);
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-neutral-800/80 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase tracking-wider">New Poll</span>
        <button type="button" onClick={onCancel} className="text-neutral-400 hover:text-white text-xs">
          Cancel
        </button>
      </div>

      <div>
        <label className="text-[11px] font-medium text-neutral-400 block mb-1">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          required
          className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-medium text-neutral-400 block">Options</label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(e.target.value, idx)}
              placeholder={`Option ${idx + 1}`}
              required
              className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="p-1.5 text-neutral-500 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mt-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add option
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md disabled:opacity-50"
      >
        {isSubmitting ? "Launching..." : "Launch Poll"}
      </button>
    </form>
  );
}
