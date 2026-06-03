"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";

interface Props {
  interviewId: string;
  initialName: string | null;
}

export function EditableInterviewName({ interviewId, initialName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName || "");
  const [draft, setDraft] = useState(initialName || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Name can't be empty");
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, participantName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setName(trimmed);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") save();
    else if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={100}
            disabled={saving}
            placeholder="Participant name"
            className="text-4xl font-light text-landing-charcoal tracking-tight bg-transparent border-b border-landing-forest/40 focus:border-landing-forest outline-none min-w-[16rem]"
          />
          <button
            onClick={save}
            disabled={saving}
            aria-label="Save name"
            className="p-1.5 rounded-md text-landing-forest hover:bg-landing-forest/10 disabled:opacity-50 transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            aria-label="Cancel"
            className="p-1.5 rounded-md text-landing-stone hover:bg-landing-stone/10 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && <span className="text-xs text-landing-terracotta">{error}</span>}
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
        {name || "Anonymous Participant"}
      </h1>
      <button
        onClick={startEdit}
        aria-label="Edit participant name"
        className="p-1.5 rounded-md text-landing-stone opacity-0 group-hover:opacity-100 hover:bg-landing-stone/10 transition-all"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
