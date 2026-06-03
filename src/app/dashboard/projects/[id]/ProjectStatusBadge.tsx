"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const STATUSES = ["draft", "active", "completed"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-landing-stone/10 text-landing-stone",
  active: "bg-landing-forest/10 text-landing-forest",
  completed: "bg-landing-terracotta/10 text-landing-terracotta",
};

interface Props {
  projectId: string;
  initialStatus: string;
}

export function ProjectStatusBadge({ projectId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus as Status);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const update = async (next: Status) => {
    if (next === status) {
      setOpen(false);
      return;
    }
    setSaving(true);
    setOpen(false);
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, status: next }),
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full cursor-pointer hover:ring-1 hover:ring-current/20 transition-all disabled:opacity-50 ${STATUS_STYLES[status]}`}
      >
        {status}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-landing-charcoal/10 shadow-lg py-1 z-50 min-w-[120px]">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => update(s)}
              className={`w-full text-left px-3 py-1.5 text-[11px] uppercase tracking-wider hover:bg-landing-mist transition-colors ${
                s === status ? "font-semibold" : ""
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                s === "active" ? "bg-landing-forest" : s === "completed" ? "bg-landing-terracotta" : "bg-landing-stone"
              }`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
