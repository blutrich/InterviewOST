import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RecommendationsClient } from "@/components/recommendations";
import type { Recommendation, Theme } from "@/components/recommendations/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecommendationsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, research_goals, target_audience, desired_outcome")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Themes = top-level approved opportunities (direct children of the root outcome).
  // The root outcome itself is type='outcome' with parent_id=NULL. Themes have
  // parent_id pointing at the root and are typically type='opportunity'.
  const { data: rootRows } = await supabase
    .from("opportunities")
    .select("id")
    .eq("project_id", id)
    .eq("type", "outcome")
    .is("parent_id", null);

  const rootId = rootRows?.[0]?.id ?? null;

  const themesQuery = supabase
    .from("opportunities")
    .select("id, title, description, type, status, evidence_count")
    .eq("project_id", id)
    .neq("type", "outcome")
    .neq("status", "rejected")
    .order("evidence_count", { ascending: false })
    .order("created_at", { ascending: true });

  // If a root exists, scope to its direct children. Otherwise (legacy projects),
  // fall back to "top-level non-outcome opportunities with no parent" so the page
  // is still useful.
  const { data: themeRows } = rootId
    ? await themesQuery.eq("parent_id", rootId)
    : await themesQuery.is("parent_id", null);

  const themes: Theme[] = (themeRows || []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    status: t.status,
    evidence_count: t.evidence_count ?? 0,
  }));

  // Fetch existing recommendations for the project
  const { data: recRows } = await supabase
    .from("recommendations")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const recommendations: Recommendation[] = (recRows || []) as Recommendation[];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-4">
            <Link href="/dashboard" className="hover:text-landing-charcoal transition-colors">
              Projects
            </Link>
            <span className="text-landing-stone/40">/</span>
            <Link
              href={`/dashboard/projects/${id}`}
              className="hover:text-landing-charcoal transition-colors"
            >
              {project.name}
            </Link>
            <span className="text-landing-stone/40">/</span>
            <span className="text-landing-charcoal">Recommendations</span>
          </div>

          <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
            Solution Recommendations
          </h1>
          <p className="text-landing-stone mt-2 max-w-2xl">
            Four product recommendations per theme — practical, bold, moonshot, and standalone — grounded in your
            interview evidence. Approve or reject each to shape the action plan.
          </p>
        </div>
        <Link
          href={`/dashboard/projects/${id}/tree`}
          className="h-10 px-5 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
        >
          Back to Tree
        </Link>
      </div>

      <RecommendationsClient
        projectId={id}
        themes={themes}
        initialRecommendations={recommendations}
        projectContext={{
          name: project.name,
          research_goals: project.research_goals,
          target_audience: project.target_audience,
          desired_outcome: project.desired_outcome,
        }}
      />
    </div>
  );
}
