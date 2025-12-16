import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="hover:text-gray-700"
            >
              {interview.projects?.name}
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/projects/${projectId}/interviews`}
              className="hover:text-gray-700"
            >
              Interviews
            </Link>
            <span>/</span>
            <span>Snapshot</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Interview Snapshot
            <Badge
              variant={interview.status === "completed" ? "default" : "secondary"}
            >
              {interview.status}
            </Badge>
          </h1>
          <p className="text-gray-500 mt-1">
            {interview.participant_name || "Anonymous Participant"} -{" "}
            {new Date(interview.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${projectId}/interviews/${interviewId}`}>
              View Transcript
            </Link>
          </Button>
          {snapshot?.status === "approved" && (
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/tree`}>View OST</Link>
            </Button>
          )}
        </div>
      </div>

      {/* No snapshot yet */}
      {!snapshot && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          {isCompleted ? (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-blue-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Ready to Generate Snapshot
              </h2>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                This interview is complete. Generate an AI-powered Interview
                Snapshot following Teresa Torres&apos; methodology.
              </p>
              <GenerateSnapshotButton interviewId={interviewId} />
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Interview In Progress</h2>
              <p className="text-gray-500 max-w-md mx-auto">
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
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Next Steps
              </h3>
              <p className="text-green-700 dark:text-green-300 mb-4">
                This snapshot has been validated. Extract opportunities and map them
                to your Opportunity Solution Tree.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot/map`}>
                    Extract Opportunities
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/projects/${projectId}/tree`}>
                    View OST
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
