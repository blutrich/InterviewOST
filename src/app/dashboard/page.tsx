import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch projects the user can access (owned + shared via project_members).
  // RLS scopes the result, so no explicit user_id filter is needed.
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      interviews:interviews(count),
      templates:templates(count)
    `
    )
    .order("created_at", { ascending: false });

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
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-2">
            Dashboard
          </p>
          <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
            Your Projects
          </h1>
          <p className="text-landing-stone mt-2">
            Manage your continuous discovery research
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 h-11 px-6 bg-landing-charcoal text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Project
        </Link>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group"
            >
              <div className="h-full bg-white rounded-2xl border border-landing-charcoal/5 p-6 hover:border-landing-forest/20 hover:shadow-lg hover:shadow-landing-forest/5 transition-all duration-500">
                {/* Number & Status */}
                <div className="flex items-start justify-between mb-6">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-landing-stone font-medium">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${getStatusStyle(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-medium text-landing-charcoal mb-2 group-hover:text-landing-forest transition-colors duration-300">
                  {project.name}
                </h3>
                <p className="text-sm text-landing-stone line-clamp-2 mb-6">
                  {project.description || project.research_goals}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-landing-charcoal/5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-landing-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <span className="text-sm text-landing-charcoal font-medium">
                      {(project.interviews as { count: number }[])?.[0]?.count || 0}
                    </span>
                    <span className="text-xs text-landing-stone">interviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-landing-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-landing-charcoal font-medium">
                      {(project.templates as { count: number }[])?.[0]?.count || 0}
                    </span>
                    <span className="text-xs text-landing-stone">templates</span>
                  </div>
                </div>

                {/* Date */}
                <p className="text-[11px] text-landing-stone/60 uppercase tracking-wider mt-4">
                  {new Date(project.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="relative bg-white rounded-3xl border border-landing-charcoal/5 p-12 text-center overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-landing-forest/10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border border-landing-terracotta/10" />

          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-landing-forest/5 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-landing-charcoal mb-2">
              No projects yet
            </h3>
            <p className="text-landing-stone mb-8 max-w-sm mx-auto">
              Create your first project to start conducting continuous discovery interviews.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 h-12 px-8 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300"
            >
              Create Your First Project
            </Link>
          </div>
        </div>
      )}

      {/* Teresa Torres Tip */}
      <div className="relative bg-landing-charcoal rounded-3xl p-8 lg:p-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full border border-white/5 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border border-landing-terracotta/20 -translate-x-1/2 translate-y-1/2" />

        <div className="relative flex gap-6 items-start">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-landing-terracotta/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-3">
              Teresa Torres Tip
            </p>
            <p className="text-xl text-white/90 font-light leading-relaxed max-w-2xl">
              &ldquo;Interview weekly, not just when you have a big project. Continuous
              discovery means making talking to customers a habit, not an event.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
