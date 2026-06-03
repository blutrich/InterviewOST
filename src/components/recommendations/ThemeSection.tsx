"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "./RecommendationCard";
import { Recommendation, Theme, RECOMMENDATION_ORDER } from "./types";

interface RecommendationUpdates {
  status?: Recommendation["status"];
  human_notes?: string;
  owner_email?: string | null;
}

interface Props {
  theme: Theme;
  recommendations: Recommendation[];
  isGenerating: boolean;
  onGenerate: (themeId: string) => Promise<void>;
  onUpdate: (id: string, updates: RecommendationUpdates) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ThemeSection({
  theme,
  recommendations,
  isGenerating,
  onGenerate,
  onUpdate,
  onDelete,
}: Props) {
  const [themeCollapsed, setThemeCollapsed] = useState(false);
  // null = no theme-level command; true/false = force every card to that state
  // (sticky after the command — cards can still toggle individually until
  // another "Expand all"/"Collapse all" press flips it)
  const [expandAllSignal, setExpandAllSignal] = useState<boolean | null>(null);

  const hasAny = recommendations.length > 0;

  const sorted = RECOMMENDATION_ORDER.map((type) =>
    recommendations.find((r) => r.type === type)
  ).filter((r): r is Recommendation => r !== undefined);

  const counts = {
    total: recommendations.length,
    approved: recommendations.filter((r) => r.status === "approved").length,
    pending: recommendations.filter((r) => r.status === "pending").length,
    rejected: recommendations.filter((r) => r.status === "rejected").length,
  };

  return (
    <Card className="bg-white border border-landing-charcoal/10 shadow-none">
      <CardHeader className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setThemeCollapsed((v) => !v)}
            className="flex items-start gap-3 text-left flex-1 min-w-0 group"
            aria-expanded={!themeCollapsed}
          >
            <span
              className="mt-1 text-landing-stone group-hover:text-landing-charcoal transition-colors shrink-0"
              aria-hidden
            >
              {themeCollapsed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-landing-stone">
                  Theme
                </span>
                {theme.evidence_count > 0 && (
                  <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                    {theme.evidence_count} {theme.evidence_count === 1 ? "evidence" : "evidence pieces"}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize border-gray-200 text-gray-600">
                  {theme.status}
                </Badge>
              </div>
              <div className="text-lg font-medium text-landing-charcoal leading-tight">
                {theme.title}
              </div>
              {theme.description && (
                <p className="text-sm text-landing-stone mt-1.5 leading-relaxed">{theme.description}</p>
              )}

              {hasAny && (
                <p className="text-xs text-gray-500 mt-2">
                  {counts.total} recommendation{counts.total === 1 ? "" : "s"}
                  {" · "}
                  <span className="text-emerald-700">{counts.approved} approved</span>
                  {" · "}
                  {counts.pending} pending
                  {counts.rejected > 0 && <> · {counts.rejected} rejected</>}
                </p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {hasAny && !themeCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandAllSignal((v) => !v)}
                className="text-xs text-gray-500 hover:text-landing-charcoal"
              >
                {expandAllSignal ? "Collapse all" : "Expand all"}
              </Button>
            )}
            <Button
              onClick={() => onGenerate(theme.id)}
              disabled={isGenerating}
              size="sm"
              variant={hasAny ? "outline" : "default"}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : hasAny ? (
                "Regenerate"
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!themeCollapsed && (
        <CardContent className="p-5 pt-0 border-t border-landing-charcoal/5">
          {hasAny ? (
            <div className="grid gap-3 md:grid-cols-2 pt-4">
              {sorted.map((r) => (
                <RecommendationCard
                  key={r.id}
                  recommendation={r}
                  expandedOverride={expandAllSignal ?? undefined}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ) : !isGenerating ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
              No recommendations yet for this theme. Click <span className="font-medium">Generate</span> to get four product ideas
              (solid, bold, moonshot, and standalone) backed by the interview evidence under this theme.
            </div>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}
