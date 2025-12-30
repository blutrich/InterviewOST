import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project with related data
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      templates(*),
      interviews(*, snapshots(*))
    `
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const templates = project.templates || [];
  const interviews = project.interviews || [];
  const completedInterviews = interviews.filter(
    (i: { status: string }) => i.status === "completed"
  );
  const pendingSnapshots = interviews.filter(
    (i: { status: string; snapshots: unknown[] }) =>
      i.status === "completed" && (!i.snapshots || i.snapshots.length === 0)
  );

  const stats = [
    { label: "Templates", value: templates.length, color: "landing-forest" },
    { label: "Total Interviews", value: interviews.length, color: "landing-charcoal" },
    { label: "Completed", value: completedInterviews.length, color: "landing-terracotta" },
    { label: "Pending Analysis", value: pendingSnapshots.length, color: "landing-stone" },
  ];

  const quickActions = [
    {
      title: "PM Board",
      description: "Kanban view of your discovery workflow",
      href: `/dashboard/projects/${id}/board`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      accent: "bg-blue-600",
    },
    {
      title: "Create Template",
      description: "Generate story-based interview rubric",
      href: `/dashboard/projects/${id}/templates`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      accent: "bg-landing-forest",
    },
    {
      title: "Conduct Interview",
      description: "Start a new participant interview",
      href: `/dashboard/projects/${id}/interviews`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      ),
      accent: "bg-landing-terracotta",
    },
    {
      title: "View OST",
      description: "Explore opportunity solution tree",
      href: `/dashboard/projects/${id}/tree`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      accent: "bg-landing-charcoal",
    },
  ];

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
    <div className="space-y-10">
      {/* Header */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-4">
          <Link href="/dashboard" className="hover:text-landing-charcoal transition-colors">
            Projects
          </Link>
          <span className="text-landing-stone/40">/</span>
          <span className="text-landing-charcoal">{project.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
                {project.name}
              </h1>
              <span className={`text-[10px] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full ${getStatusStyle(project.status)}`}>
                {project.status}
              </span>
            </div>
            <p className="text-landing-stone max-w-2xl">
              {project.description || project.research_goals}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/projects/${id}/templates`}
              className="h-10 px-5 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
            >
              Edit Template
            </Link>
            <Link
              href={`/dashboard/projects/${id}/interviews`}
              className="h-10 px-5 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 flex items-center"
            >
              View Interviews
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl border border-landing-charcoal/5 p-6">
            <p className="text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-3">
              {stat.label}
            </p>
            <p className={`text-4xl font-light text-${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Research Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-landing-charcoal/5 p-8">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-6">
            Research Details
          </h2>
          <div className="space-y-6">
            <div>
              <h4 className="text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-2">
                Research Goals
              </h4>
              <p className="text-landing-charcoal">{project.research_goals}</p>
            </div>
            {project.target_audience && (
              <div>
                <h4 className="text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-2">
                  Target Audience
                </h4>
                <p className="text-landing-charcoal">{project.target_audience}</p>
              </div>
            )}
            {project.desired_outcome && (
              <div>
                <h4 className="text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-2">
                  Desired Outcome (OST Root)
                </h4>
                <p className="text-landing-charcoal">{project.desired_outcome}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Quick Actions
          </h2>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group block bg-white rounded-2xl border border-landing-charcoal/5 p-5 hover:border-landing-forest/20 hover:shadow-lg hover:shadow-landing-forest/5 transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${action.accent} flex items-center justify-center text-white flex-shrink-0`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-medium text-landing-charcoal group-hover:text-landing-forest transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-landing-stone">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Interviews */}
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Recent Interviews
          </h2>
          {interviews.length > 0 && (
            <Link
              href={`/dashboard/projects/${id}/interviews`}
              className="text-[11px] uppercase tracking-wider text-landing-forest hover:text-landing-forest-light transition-colors"
            >
              View All →
            </Link>
          )}
        </div>

        {interviews.length > 0 ? (
          <div className="space-y-3">
            {interviews.slice(0, 5).map((interview: { id: string; participant_name: string; status: string; created_at: string }, index: number) => (
              <div
                key={interview.id}
                className="flex items-center justify-between py-4 border-b border-landing-charcoal/5 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-landing-stone/60 w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium text-landing-charcoal">
                      {interview.participant_name || "Anonymous Participant"}
                    </p>
                    <p className="text-sm text-landing-stone">
                      {new Date(interview.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${getStatusStyle(interview.status)}`}>
                    {interview.status}
                  </span>
                  <Link
                    href={`/dashboard/projects/${id}/interviews/${interview.id}/snapshot`}
                    className="text-[11px] uppercase tracking-wider text-landing-forest hover:text-landing-forest-light transition-colors"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-landing-stone mb-4">No interviews yet</p>
            <Link
              href={`/dashboard/projects/${id}/interviews`}
              className="inline-flex items-center h-10 px-6 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300"
            >
              Create First Interview
            </Link>
          </div>
        )}
      </div>

      {/* OST Preview Card */}
      <div className="relative bg-landing-charcoal rounded-3xl p-8 overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full border border-white/5 translate-x-1/4 -translate-y-1/4" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-2">
              Opportunity Solution Tree
            </p>
            <p className="text-xl text-white/90 font-light">
              Visualize your discovery insights
            </p>
          </div>
          <Link
            href={`/dashboard/projects/${id}/tree`}
            className="h-10 px-6 bg-white text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-mist transition-all duration-300 flex items-center gap-2"
          >
            Open OST
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
