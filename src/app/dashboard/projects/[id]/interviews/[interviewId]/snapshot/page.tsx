import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
import {
  ExperienceMap,
  QuoteReel,
  FactsPanel,
  BlindSpotAlert,
  ValidationUI,
} from "@/components/snapshot";
import { GenerateSnapshotButton } from "./GenerateSnapshotButton";

interface Props {
  params: Promise<{ id: string; interviewId: string }>;
}

export default async function InterviewSnapshotPage({ params }: Props) {
  const { id: projectId, interviewId } = await params;
  const supabase = await createServiceClient();

  // Fetch interview
  const { data: interview, error } = await supabase
    .from("interviews")
    .select("*, projects(name)")
    .eq("id", interviewId)
    .single();

  if (error || !interview) {
    notFound();
  }

  // Fetch snapshot separately (more reliable than join)
  const { data: snapshot } = await supabase
    .from("snapshots")
    .select("*")
    .eq("interview_id", interviewId)
    .single();

  const isCompleted = interview.status === "completed";

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-landing-forest/10 text-landing-forest";
      case "active":
        return "bg-landing-terracotta/10 text-landing-terracotta";
      default:
        return "bg-landing-stone/10 text-landing-stone";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-4">
          <Link href="/dashboard" className="hover:text-landing-charcoal transition-colors">
            Projects
          </Link>
          <span className="text-landing-stone/40">/</span>
          <Link href={`/dashboard/projects/${projectId}`} className="hover:text-landing-charcoal transition-colors">
            {interview.projects?.name}
          </Link>
          <span className="text-landing-stone/40">/</span>
          <Link href={`/dashboard/projects/${projectId}/interviews`} className="hover:text-landing-charcoal transition-colors">
            Interviews
          </Link>
          <span className="text-landing-stone/40">/</span>
          <Link href={`/dashboard/projects/${projectId}/interviews/${interviewId}`} className="hover:text-landing-charcoal transition-colors">
            {interview.participant_name || "Anonymous"}
          </Link>
          <span className="text-landing-stone/40">/</span>
          <span className="text-landing-charcoal">Snapshot</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
                Interview Snapshot
              </h1>
              <span className={`text-[10px] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full ${getStatusStyle(interview.status)}`}>
                {interview.status}
              </span>
            </div>
            <p className="text-landing-stone">
              {interview.participant_name || "Anonymous Participant"} •{" "}
              {new Date(interview.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/projects/${projectId}/interviews/${interviewId}`}
              className="h-10 px-5 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
            >
              View Transcript
            </Link>
            {snapshot?.status === "approved" && (
              <Link
                href={`/dashboard/projects/${projectId}/tree`}
                className="h-10 px-5 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 flex items-center"
              >
                View OST
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* No snapshot yet */}
      {!snapshot && (
        <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-12 text-center">
          {isCompleted ? (
            <>
              <div className="w-20 h-20 rounded-full bg-landing-forest/10 mx-auto mb-8 flex items-center justify-center">
                <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-landing-charcoal mb-3">
                Ready to Generate Snapshot
              </h2>
              <p className="text-landing-stone mb-8 max-w-md mx-auto">
                This interview is complete. Generate an AI-powered Interview
                Snapshot following Teresa Torres&apos; methodology.
              </p>
              <GenerateSnapshotButton interviewId={interviewId} />
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-landing-stone/10 mx-auto mb-8 flex items-center justify-center">
                <svg className="w-10 h-10 text-landing-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-landing-charcoal mb-3">Interview In Progress</h2>
              <p className="text-landing-stone max-w-md mx-auto">
                Complete the interview first before generating a snapshot.
              </p>
            </>
          )}
        </div>
      )}

      {/* Snapshot exists */}
      {snapshot && (
        <div className="space-y-6">
          {/* Validation UI */}
          <ValidationUI
            snapshotId={snapshot.id}
            status={snapshot.status}
            humanNotes={snapshot.human_notes}
            validatedAt={snapshot.validated_at}
          />

          {/* Experience Map */}
          <ExperienceMap steps={snapshot.experience_map || []} />

          {/* Two-column layout for Quote Reel and Facts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <QuoteReel quotes={snapshot.quote_reel || []} />
            <FactsPanel facts={snapshot.facts || {}} />
          </div>

          {/* Blind Spots */}
          <BlindSpotAlert blindSpots={snapshot.blind_spots || []} />

          {/* Next Steps */}
          {snapshot.status === "approved" && (
            <div className="relative bg-landing-charcoal rounded-3xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full border border-white/5 translate-x-1/4 -translate-y-1/4" />

              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-2">
                  Next Steps
                </p>
                <h3 className="text-xl text-white mb-3">
                  Snapshot Validated
                </h3>
                <p className="text-white/70 mb-6 max-w-xl">
                  This snapshot has been validated. Extract opportunities and map them
                  to your Opportunity Solution Tree.
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot/map`}
                    className="h-10 px-6 bg-white text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-mist transition-all duration-300 flex items-center gap-2"
                  >
                    Extract Opportunities
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                  <Link
                    href={`/dashboard/projects/${projectId}/tree`}
                    className="h-10 px-6 border border-white/20 text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-white/40 transition-all duration-300 flex items-center"
                  >
                    View OST
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
