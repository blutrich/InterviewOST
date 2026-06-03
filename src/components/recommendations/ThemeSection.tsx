"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "./RecommendationCard";
import { Recommendation, Theme, RECOMMENDATION_ORDER } from "./types";

interface Props {
  theme: Theme;
  recommendations: Recommendation[];
  isGenerating: boolean;
  onGenerate: (themeId: string) => Promise<void>;
  onUpdate: (id: string, updates: { status?: Recommendation["status"]; human_notes?: string }) => Promise<void>;
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
  const hasAny = recommendations.length > 0;

  // Sort by canonical tier order, so the UI always reads solid → bold → moonshot → standalone
  const sorted = RECOMMENDATION_ORDER.map((type) =>
    recommendations.find((r) => r.type === type)
  ).filter((r): r is Recommendation => r !== undefined);

  return (
    <Card className="border-landing-charcoal/10">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-purple-300 text-purple-700 capitalize">
                {theme.type === "outcome" ? "Outcome" : "Theme"}
              </Badge>
              {theme.evidence_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  {theme.evidence_count} {theme.evidence_count === 1 ? "evidence" : "evidence pieces"}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">{theme.status}</Badge>
            </div>
            <CardTitle className="text-xl font-medium leading-tight">{theme.title}</CardTitle>
            {theme.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{theme.description}</p>
            )}
          </div>

          <Button
            onClick={() => onGenerate(theme.id)}
            disabled={isGenerating}
            size="sm"
            className="shrink-0"
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
              "Generate Recommendations"
            )}
          </Button>
        </div>
      </CardHeader>

      {hasAny && (
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2">
            {sorted.map((r) => (
              <RecommendationCard
                key={r.id}
                recommendation={r}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </CardContent>
      )}

      {!hasAny && !isGenerating && (
        <CardContent className="pt-0">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 border border-gray-200">
            No recommendations yet for this theme. Click <span className="font-medium">Generate Recommendations</span> to get
            four product ideas (solid, bold, moonshot, and standalone) backed by the interview evidence under this theme.
          </div>
        </CardContent>
      )}
    </Card>
  );
}
