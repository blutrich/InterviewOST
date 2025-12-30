import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BoardClient } from "./BoardClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project with interviews and opportunities
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      interviews(*, snapshots(*)),
      opportunities(*, evidence(*))
    `
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const interviews = project.interviews || [];
  const opportunities = project.opportunities || [];

  // Transform data for kanban cards
  const interviewCards = interviews.map((interview: {
    id: string;
    participant_name: string;
    status: string;
    created_at: string;
    snapshots?: { id: string }[];
  }) => ({
    id: interview.id,
    title: interview.participant_name || "Anonymous Participant",
    subtitle: interview.snapshots?.length
      ? `${interview.snapshots.length} snapshot(s)`
      : "No snapshot yet",
    status: interview.status,
    type: "interview" as const,
    metadata: {
      date: new Date(interview.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      participant: interview.participant_name,
    },
  }));

  const opportunityCards = opportunities.map((opp: {
    id: string;
    title: string;
    description?: string;
    status?: string;
    evidence?: { id: string }[];
  }) => ({
    id: opp.id,
    title: opp.title,
    subtitle: opp.description,
    status: opp.status || "define",
    type: "opportunity" as const,
    metadata: {
      evidenceCount: opp.evidence?.length || 0,
    },
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-landing-charcoal tracking-tight">
            PM Board
          </h2>
          <p className="text-landing-stone text-sm">
            Drag and drop to manage your discovery workflow
          </p>
        </div>
      </div>

      {/* Board */}
      <BoardClient
        projectId={id}
        interviewCards={interviewCards}
        opportunityCards={opportunityCards}
      />
    </div>
  );
}
