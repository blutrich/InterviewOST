"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Recommendation, RecommendationType, TYPE_META } from "./types";

interface Props {
  recommendation: Recommendation;
  onUpdate: (id: string, updates: { status?: Recommendation["status"]; human_notes?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function TypeIcon({ type }: { type: RecommendationType }) {
  // Minimal inline icons so we don't pull a new dep
  const common = "w-4 h-4";
  switch (type) {
    case "solid":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "bold":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
        </svg>
      );
    case "moonshot":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l4-1 11-11a2.121 2.121 0 00-3-3l-11 11-1 4z" />
        </svg>
      );
    case "standalone":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25V6.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6" />
        </svg>
      );
  }
}

export function RecommendationCard({ recommendation: r, onUpdate, onDelete }: Props) {
  const meta = TYPE_META[r.type];
  const [notes, setNotes] = useState(r.human_notes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [pending, setPending] = useState<"approve" | "reject" | "notes" | null>(null);

  const handle = async (action: "approve" | "reject") => {
    setPending(action);
    try {
      await onUpdate(r.id, { status: action === "approve" ? "approved" : "rejected" });
    } finally {
      setPending(null);
    }
  };

  const saveNotes = async () => {
    setPending("notes");
    try {
      await onUpdate(r.id, { human_notes: notes });
      setShowNotes(false);
    } finally {
      setPending(null);
    }
  };

  const statusBadge =
    r.status === "approved" ? (
      <Badge className="bg-emerald-600 hover:bg-emerald-700">Approved</Badge>
    ) : r.status === "rejected" ? (
      <Badge variant="outline" className="border-red-300 text-red-700">Rejected</Badge>
    ) : (
      <Badge variant="outline">Pending</Badge>
    );

  return (
    <Card className={`border-2 ${meta.borderClass} ${meta.bgClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-1 ${meta.textClass}`}>
              <TypeIcon type={r.type} />
            </div>
            <div>
              <div className={`text-[10px] uppercase tracking-[0.15em] font-medium ${meta.textClass}`}>
                {meta.label}
              </div>
              <CardTitle className="text-base mt-1 leading-tight">{r.title}</CardTitle>
              <p className="text-[11px] text-gray-500 mt-1">{meta.tagline}</p>
            </div>
          </div>
          {statusBadge}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <Section label="What it is">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{r.explanation}</p>
        </Section>

        <Section label="Why this makes sense">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{r.rationale}</p>
        </Section>

        <Section label="Supporting evidence">
          <ul className="space-y-1.5 list-disc list-inside text-gray-800">
            {r.supporting_examples.map((ex, i) => (
              <li key={i} className="leading-relaxed">{ex}</li>
            ))}
          </ul>
        </Section>

        <Section label="Expected value">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{r.expected_value}</p>
        </Section>

        <Section label="Next step (this week)" highlight>
          <p className="text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">{r.call_to_action}</p>
        </Section>

        {r.human_notes && !showNotes && (
          <Section label="Your notes">
            <p className="text-gray-700 italic whitespace-pre-wrap">{r.human_notes}</p>
          </Section>
        )}

        {showNotes && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-medium text-gray-500">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this a good/bad fit? What would you change?"
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowNotes(false)}>Cancel</Button>
              <Button size="sm" onClick={saveNotes} disabled={pending === "notes"}>
                {pending === "notes" ? "Saving…" : "Save Notes"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-800 underline-offset-2 hover:underline"
          >
            {showNotes ? "Hide notes" : r.human_notes ? "Edit notes" : "Add notes"}
          </button>
          <div className="flex gap-2">
            {r.status !== "rejected" && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => handle("reject")}
                disabled={pending !== null}
              >
                {pending === "reject" ? "…" : "Reject"}
              </Button>
            )}
            {r.status !== "approved" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handle("approve")}
                disabled={pending !== null}
              >
                {pending === "approve" ? "…" : "Approve"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-red-700"
              onClick={() => onDelete(r.id)}
              title="Delete recommendation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-[0.15em] font-medium mb-1.5 ${highlight ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </div>
      <div className={highlight ? "bg-white rounded-md p-3 border border-gray-200" : ""}>
        {children}
      </div>
    </div>
  );
}
