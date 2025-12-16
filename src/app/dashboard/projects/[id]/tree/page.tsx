import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OSTCanvasWrapper } from "./OSTCanvasWrapper";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OpportunityTreePage({ params }: Props) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  // Fetch project with opportunities
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      opportunities(*, evidence(*))
    `
    )
    .eq("id", projectId)
    .single();

  if (error || !project) {
    notFound();
  }

  const opportunities = project.opportunities || [];
  const approvedCount = opportunities.filter(
    (o: { status: string }) => o.status === "approved"
  ).length;
  const suggestedCount = opportunities.filter(
    (o: { status: string }) => o.status === "suggested"
  ).length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href={`/dashboard/projects/${projectId}`} className="hover:text-gray-700">
              {project.name}
            </Link>
            <span>/</span>
            <span>Opportunity Tree</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Opportunity Solution Tree
          </h1>
          {project.desired_outcome && (
            <p className="text-gray-500 mt-1">
              Root Outcome: {project.desired_outcome}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Badge variant="default" className="bg-green-500">
              {approvedCount} Approved
            </Badge>
            {suggestedCount > 0 && (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                {suggestedCount} Pending
              </Badge>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${projectId}/interviews`}>
              View Interviews
            </Link>
          </Button>
        </div>
      </div>

      {/* Tree Canvas */}
      {opportunities.length === 0 && !project.desired_outcome ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-purple-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Start Your OST</h2>
            <p className="text-gray-500 mb-4">
              Your Opportunity Solution Tree will grow as you conduct interviews
              and approve snapshots. Start by setting a desired outcome for your
              project.
            </p>
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/interviews`}>
                Conduct Interviews
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
          <OSTCanvasWrapper
            projectId={projectId}
            rootOutcome={project.desired_outcome}
            opportunities={opportunities}
          />
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex-shrink-0">
        <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
          Teresa Torres Tip
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          &quot;Trees over Lists&quot; - Structure opportunities hierarchically, not as a
          flat backlog. Each opportunity should connect to a parent, ultimately
          rolling up to your root outcome.
        </p>
      </div>
    </div>
  );
}
