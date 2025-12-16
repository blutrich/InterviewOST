import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OSTCanvasWrapper } from "./OSTCanvasWrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpportunityTreePage({ params }: Props) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  // Fetch project with opportunities and interviews
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      opportunities(*, evidence(*)),
      interviews(id, participant_name, status, created_at, snapshots(id, status))
    `
    )
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  const opportunities = project.opportunities || [];
  const interviews = (project.interviews || []).map((interview: {
    id: string;
    participant_name: string | null;
    status: string;
    created_at: string;
    snapshots?: Array<{ id: string; status: string }>;
  }) => ({
    ...interview,
    snapshot_status: interview.snapshots?.[0]?.status,
  }));
  const approvedCount = opportunities.filter(
    (o: { status: string }) => o.status === "approved"
  ).length;
  const suggestedCount = opportunities.filter(
    (o: { status: string }) => o.status === "suggested"
  ).length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-4">
            <Link href="/dashboard" className="hover:text-landing-charcoal transition-colors">
              Projects
            </Link>
            <span className="text-landing-stone/40">/</span>
            <Link href={`/dashboard/projects/${projectId}`} className="hover:text-landing-charcoal transition-colors">
              {project.name}
            </Link>
            <span className="text-landing-stone/40">/</span>
            <span className="text-landing-charcoal">Opportunity Tree</span>
          </div>

          <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
            Opportunity Solution Tree
          </h1>
          {project.desired_outcome && (
            <p className="text-landing-stone mt-2">
              Root Outcome: {project.desired_outcome}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="text-[10px] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full bg-landing-forest/10 text-landing-forest">
              {approvedCount} Approved
            </span>
            {suggestedCount > 0 && (
              <span className="text-[10px] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full bg-landing-terracotta/10 text-landing-terracotta">
                {suggestedCount} Pending
              </span>
            )}
          </div>
          <Link
            href={`/dashboard/projects/${projectId}/interviews`}
            className="h-10 px-5 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
          >
            View Interviews
          </Link>
        </div>
      </div>

      {/* Tree Canvas */}
      {opportunities.length === 0 && !project.desired_outcome ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-landing-charcoal/5">
          <div className="text-center max-w-md p-8">
            <div className="w-20 h-20 rounded-full bg-landing-forest/10 mx-auto mb-8 flex items-center justify-center">
              <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-landing-charcoal mb-3">Start Your OST</h2>
            <p className="text-landing-stone mb-8">
              Your Opportunity Solution Tree will grow as you conduct interviews
              and approve snapshots. Start by setting a desired outcome for your
              project.
            </p>
            <Link
              href={`/dashboard/projects/${projectId}/interviews`}
              className="inline-flex h-10 px-6 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 items-center"
            >
              Conduct Interviews
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 border border-landing-charcoal/5 rounded-2xl overflow-hidden bg-white">
          <OSTCanvasWrapper
            projectId={projectId}
            rootOutcome={project.desired_outcome}
            opportunities={opportunities}
            interviews={interviews}
          />
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 relative bg-landing-charcoal rounded-2xl p-6 flex-shrink-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full border border-white/5 translate-x-1/4 -translate-y-1/4" />
        <div className="relative flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-landing-terracotta/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
              Teresa Torres Tip
            </p>
            <p className="text-sm text-white/80">
              &quot;Trees over Lists&quot; - Structure opportunities hierarchically, not as a
              flat backlog. Each opportunity should connect to a parent, ultimately
              rolling up to your root outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
