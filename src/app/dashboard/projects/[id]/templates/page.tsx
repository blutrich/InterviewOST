import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
            <span className="text-gray-900">Templates</span>
          </div>
          <h1 className="text-3xl font-bold">Interview Templates</h1>
          <p className="text-gray-500 mt-1">
            Story-based interview rubrics for conducting discovery interviews
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/projects/${id}`}>Back to Project</Link>
        </Button>
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
