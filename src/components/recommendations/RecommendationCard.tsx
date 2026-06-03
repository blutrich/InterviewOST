"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Recommendation, TYPE_META } from "./types";

interface RecommendationUpdates {
  status?: Recommendation["status"];
  human_notes?: string;
  owner_email?: string | null;
}

interface Props {
  recommendation: Recommendation;
  /**
   * Theme-level override. When this prop changes, the card's expanded state
   * is set to match. After that the user can still toggle individually until
   * the override changes again.
   */
  expandedOverride?: boolean;
  onUpdate: (id: string, updates: RecommendationUpdates) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PREVIEW_CHARS = 160;

export function RecommendationCard({
  recommendation: r,
  expandedOverride,
  onUpdate,
  onDelete,
}: Props) {
  const meta = TYPE_META[r.type];
  const [expanded, setExpanded] = useState(false);

  // Sync to theme-level "expand all" / "collapse all" commands.
  // We intentionally do NOT include `expanded` in the deps — we only want to
  // re-sync when the parent's command actually changes.
  useEffect(() => {
    if (typeof expandedOverride === "boolean") {
      setExpanded(expandedOverride);
    }
  }, [expandedOverride]);

  const [notes, setNotes] = useState(r.human_notes || "");
  const [showNotes, setShowNotes] = useState(false);

  const [ownerEditing, setOwnerEditing] = useState(false);
  const [ownerInput, setOwnerInput] = useState(r.owner_email || "");

  const [prFeedback, setPrFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState<"approve" | "reject" | "notes" | "owner" | null>(null);

  const handleStatus = async (action: "approve" | "reject") => {
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

  const saveOwner = async (email: string | null) => {
    setPending("owner");
    try {
      await onUpdate(r.id, { owner_email: email });
      setOwnerEditing(false);
    } finally {
      setPending(null);
    }
  };

  const handlePrClick = () => {
    setPrFeedback("PR generation isn't wired up yet — coming soon.");
    setTimeout(() => setPrFeedback(null), 3500);
  };

  const previewText =
    r.explanation.length > PREVIEW_CHARS
      ? `${r.explanation.slice(0, PREVIEW_CHARS).trimEnd()}…`
      : r.explanation;

  return (
    <Card className="bg-white border border-landing-charcoal/10 shadow-none hover:border-landing-charcoal/20 transition-colors">
      <CardContent className="p-5 space-y-3">
        {/* Header — clickable to toggle expand */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-start justify-between gap-3 text-left group"
          aria-expanded={expanded}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <span className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0 ${meta.accentDotClass}`} />
            <div className="min-w-0">
              <div className={`text-[10px] uppercase tracking-[0.15em] font-medium ${meta.accentTextClass}`}>
                {meta.label}
              </div>
              <div className="text-base font-medium text-landing-charcoal mt-0.5 leading-snug">
                {r.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={r.status} />
            <span
              className="text-landing-stone group-hover:text-landing-charcoal transition-colors"
              aria-hidden
            >
              {expanded ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
          </div>
        </button>

        {/* Tagline + tier note (only visible expanded so collapsed cards stay clean) */}
        {expanded && (
          <p className="text-[11px] text-landing-stone uppercase tracking-[0.12em]">{meta.tagline}</p>
        )}

        {/* Preview (collapsed) or full content (expanded) */}
        {!expanded ? (
          <p className="text-sm text-gray-700 leading-relaxed">{previewText}</p>
        ) : (
          <div className="space-y-4 pt-1">
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

            <Section label="Next step">
              <p className="text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">{r.call_to_action}</p>
            </Section>

            {/* Owner row */}
            <div className="pt-2 border-t border-landing-charcoal/5">
              <div className="text-[10px] uppercase tracking-[0.15em] font-medium text-gray-500 mb-1.5">
                Owner
              </div>
              {ownerEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = ownerInput.trim();
                    saveOwner(trimmed ? trimmed : null);
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    type="email"
                    autoFocus
                    placeholder="owner@example.com"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" type="submit" disabled={pending === "owner"} className="h-8">
                    {pending === "owner" ? "…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOwnerInput(r.owner_email || "");
                      setOwnerEditing(false);
                    }}
                    className="h-8"
                  >
                    Cancel
                  </Button>
                </form>
              ) : r.owner_email ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-800">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1a3 3 0 006 0v-1a9 9 0 10-9 9 8.97 8.97 0 003.84-.84" />
                    </svg>
                    {r.owner_email}
                  </span>
                  <button
                    onClick={() => setOwnerEditing(true)}
                    className="text-xs text-gray-500 hover:text-landing-charcoal underline-offset-2 hover:underline"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => saveOwner(null)}
                    className="text-xs text-gray-400 hover:text-red-700 underline-offset-2 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOwnerEditing(true)}
                  className="text-sm text-gray-500 hover:text-landing-charcoal underline-offset-2 hover:underline"
                >
                  Assign owner…
                </button>
              )}
            </div>

            {/* Reviewer notes */}
            {r.human_notes && !showNotes && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] font-medium text-gray-500 mb-1.5">Your notes</div>
                <p className="text-gray-700 italic whitespace-pre-wrap text-sm">{r.human_notes}</p>
              </div>
            )}

            {showNotes && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.15em] font-medium text-gray-500">Notes</div>
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

            {/* Action row */}
            <div className="flex items-center justify-between pt-3 border-t border-landing-charcoal/5">
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="text-xs text-gray-500 hover:text-landing-charcoal underline-offset-2 hover:underline"
              >
                {showNotes ? "Hide notes" : r.human_notes ? "Edit notes" : "Add notes"}
              </button>
              <div className="flex items-center gap-2">
                {r.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => handleStatus("reject")}
                    disabled={pending !== null}
                  >
                    {pending === "reject" ? "…" : "Reject"}
                  </Button>
                )}
                {r.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() => handleStatus("approve")}
                    disabled={pending !== null}
                  >
                    {pending === "approve" ? "…" : "Approve"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 gap-1.5"
                  onClick={handlePrClick}
                  title="Generate a GitHub PR with this recommendation (coming soon)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v12m0 0a3 3 0 100 6 3 3 0 000-6zm0-12a3 3 0 100 6 3 3 0 000-6zm12 18a3 3 0 100-6 3 3 0 000 6zm0-6V9a4 4 0 00-4-4h-1.5" />
                  </svg>
                  PR
                </Button>
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

            {prFeedback && (
              <div className="text-xs text-gray-500 italic pt-1">{prFeedback}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Recommendation["status"] }) {
  if (status === "approved") {
    return (
      <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50/50">
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-gray-200 text-gray-500">
      Pending
    </Badge>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] font-medium text-gray-500 mb-1.5">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
