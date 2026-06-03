"use client";

interface Insight {
  facts: string[];
  interpretation: string;
}

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Insights
          </h2>
        </div>
        <div className="p-8 text-landing-stone text-sm">
          No additional insights captured for this interview.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
      <div className="px-8 py-6 border-b border-landing-charcoal/5">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
          Insights
        </h2>
        <p className="text-xs text-landing-stone mt-1">
          Facts (what was observed) separated from interpretation (the conclusion drawn).
        </p>
      </div>
      <div className="divide-y divide-landing-charcoal/5">
        {insights.map((insight, i) => (
          <div key={i} className="px-8 py-6">
            <ul className="space-y-1.5 mb-3">
              {insight.facts.map((fact, j) => (
                <li key={j} className="flex gap-2 text-sm text-landing-charcoal">
                  <span className="text-[10px] uppercase tracking-wider text-landing-stone font-medium mt-0.5 shrink-0">
                    Fact
                  </span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pl-0">
              <span className="text-[10px] uppercase tracking-wider text-landing-terracotta font-medium mt-0.5 shrink-0">
                Insight
              </span>
              <p className="text-sm text-landing-charcoal/90 italic">
                {insight.interpretation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
