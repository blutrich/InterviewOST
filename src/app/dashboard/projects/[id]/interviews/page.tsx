import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-gray-900">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/dashboard/projects/${id}`} className="hover:text-gray-900">
              {project.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Interviews</span>
          </div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-gray-500 mt-1">
            Manage participant interviews and view transcripts
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/projects/${id}`}>Back to Project</Link>
        </Button>
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
