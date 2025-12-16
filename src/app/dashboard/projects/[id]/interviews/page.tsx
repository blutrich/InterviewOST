import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import InterviewsClient from "./InterviewsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InterviewsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project with interviews and templates
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      templates(id, name, is_active),
      interviews(
        *,
        snapshots(id, status)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Get the active template
  const templates = project.templates || [];
  const activeTemplate = templates.find((t: { is_active: boolean }) => t.is_active);

  // Sort interviews by created_at descending and enrich with info
  const interviews = (project.interviews || [])
    .sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((interview: {
      id: string;
      snapshots: Array<{ id: string; status: string }> | null;
      template_id: string | null;
    }) => ({
      ...interview,
      has_snapshot: interview.snapshots && interview.snapshots.length > 0,
      snapshot_status: interview.snapshots?.[0]?.status,
      template_name: templates.find(
        (t: { id: string }) => t.id === interview.template_id
      )?.name,
    }));

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
            <span className="text-landing-charcoal">Interviews</span>
          </div>

          <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
            Interviews
          </h1>
          <p className="text-landing-stone mt-2">
            Manage participant interviews and view transcripts
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
      <InterviewsClient
        projectId={id}
        initialInterviews={interviews}
        activeTemplate={activeTemplate}
        hasTemplates={templates.length > 0}
      />
    </div>
  );
}
