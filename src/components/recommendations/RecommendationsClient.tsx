"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeSection } from "./ThemeSection";
import { Recommendation, Theme } from "./types";

interface Props {
  projectId: string;
  themes: Theme[];
  initialRecommendations: Recommendation[];
  projectContext: {
    name: string;
    research_goals: string;
    target_audience: string | null;
    desired_outcome: string | null;
  };
}

export default function RecommendationsClient({
  projectId,
  themes,
  initialRecommendations,
  projectContext,
}: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [generatingThemeId, setGeneratingThemeId] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Group recs by theme for the children to render
  const byTheme = useMemo(() => {
    const map = new Map<string, Recommendation[]>();
    for (const r of recommendations) {
      const arr = map.get(r.opportunity_id) || [];
      arr.push(r);
      map.set(r.opportunity_id, arr);
    }
    return map;
  }, [recommendations]);

  // Quick summary counts
  const counts = useMemo(() => {
    const total = recommendations.length;
    const approved = recommendations.filter((r) => r.status === "approved").length;
    const rejected = recommendations.filter((r) => r.status === "rejected").length;
    const pending = total - approved - rejected;
    return { total, approved, rejected, pending };
  }, [recommendations]);

  const generateForTheme = async (themeId: string) => {
    setErrorMsg(null);
    setGeneratingThemeId(themeId);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, opportunityId: themeId }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(error || "Failed to generate recommendations");
      }
      const { recommendations: fresh } = (await res.json()) as { recommendations: Recommendation[] };

      // Replace any recs that share (opportunity_id, type) with the fresh ones
      setRecommendations((prev) => {
        const next = prev.filter(
          (r) =>
            !fresh.some((f) => f.opportunity_id === r.opportunity_id && f.type === r.type)
        );
        return [...next, ...fresh];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate recommendations";
      setErrorMsg(msg);
    } finally {
      setGeneratingThemeId(null);
    }
  };

  const generateForAll = async () => {
    setBulkGenerating(true);
    setErrorMsg(null);
    try {
      // Sequential, not parallel, to respect AI rate limits (10/min)
      for (const theme of themes) {
        await generateForTheme(theme.id);
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  const updateRecommendation = async (
    id: string,
    updates: { status?: Recommendation["status"]; human_notes?: string }
  ) => {
    setErrorMsg(null);
    const res = await fetch("/api/recommendations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendationId: id, ...updates }),
    });
    if (!res.ok) {
      setErrorMsg("Failed to update recommendation");
      return;
    }
    const { recommendation } = (await res.json()) as { recommendation: Recommendation };
    setRecommendations((prev) => prev.map((r) => (r.id === id ? recommendation : r)));
  };

  const deleteRecommendation = async (id: string) => {
    setErrorMsg(null);
    const res = await fetch(`/api/recommendations?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErrorMsg("Failed to delete recommendation");
      return;
    }
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  if (themes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-600">
          <p className="mb-2 font-medium">No themes yet</p>
          <p className="text-sm text-gray-500">
            Recommendations are generated per theme. Themes are the top-level opportunities in your Opportunity
            Solution Tree. Approve a snapshot and extract opportunities first, then come back here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar with summary + bulk action */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-700">
              <span className="font-semibold">{themes.length}</span> themes ·{" "}
              <span className="font-semibold">{counts.total}</span> recommendations
            </span>
            {counts.total > 0 && (
              <span className="text-gray-500">
                ({counts.approved} approved · {counts.pending} pending · {counts.rejected} rejected)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500 max-w-sm">
              Project: <span className="text-gray-700">{projectContext.name}</span>
              {projectContext.desired_outcome ? (
                <span> · Outcome: <span className="text-gray-700">{projectContext.desired_outcome}</span></span>
              ) : null}
            </p>
            <Button onClick={generateForAll} disabled={bulkGenerating} variant="outline" size="sm">
              {bulkGenerating ? "Generating for all themes…" : "Generate for all themes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm flex items-start justify-between gap-3">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-6">
        {themes.map((theme) => (
          <ThemeSection
            key={theme.id}
            theme={theme}
            recommendations={byTheme.get(theme.id) || []}
            isGenerating={generatingThemeId === theme.id || bulkGenerating}
            onGenerate={generateForTheme}
            onUpdate={updateRecommendation}
            onDelete={deleteRecommendation}
          />
        ))}
      </div>
    </div>
  );
}
