import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectTabs } from "./ProjectTabs";
import { EditableProjectName } from "./EditableProjectName";

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project basic info
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-landing-forest/10 text-landing-forest";
      case "completed":
        return "bg-landing-terracotta/10 text-landing-terracotta";
      default:
        return "bg-landing-stone/10 text-landing-stone";
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-3">
          <Link href="/dashboard" className="hover:text-landing-charcoal transition-colors">
            Projects
          </Link>
          <span className="text-landing-stone/40">/</span>
          <span className="text-landing-charcoal font-medium">{project.name}</span>
        </div>

        {/* Project Title & Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-landing-forest flex items-center justify-center">
              <span className="text-white font-serif text-lg">
                {project.name[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <EditableProjectName projectId={id} initialName={project.name} />
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${getStatusStyle(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <ProjectTabs projectId={id} />
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
