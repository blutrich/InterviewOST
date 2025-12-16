import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TemplatesClient from "./TemplatesClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemplatesPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project with templates
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      templates(*)
    `)
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Sort templates by created_at descending
  const templates = (project.templates || []).sort(
    (a: { created_at: string }, b: { created_at: string }) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
            <Link href={`/dashboard/projects/${id}`} className="hover:text-landing-charcoal transition-colors">
              {project.name}
            </Link>
            <span className="text-landing-stone/40">/</span>
            <span className="text-landing-charcoal">Templates</span>
          </div>

          <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
            Interview Templates
          </h1>
          <p className="text-landing-stone mt-2">
            Story-based interview rubrics for conducting discovery interviews
          </p>
        </div>
        <Link
          href={`/dashboard/projects/${id}`}
          className="h-10 px-5 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
        >
          Back to Project
        </Link>
      </div>

      {/* Client component handles the interactive parts */}
      <TemplatesClient
        projectId={id}
        initialTemplates={templates}
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
