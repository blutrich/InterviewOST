import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge
              variant={project.status === "active" ? "default" : "secondary"}
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">
            {project.description || project.research_goals}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${id}/templates`}>Edit Template</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/projects/${id}/interviews`}>View Interviews</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedInterviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSnapshots.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interviews">Recent Interviews</TabsTrigger>
          <TabsTrigger value="tree">Opportunity Tree</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Research Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Research Goals
                </h4>
                <p className="mt-1">{project.research_goals}</p>
              </div>
              {project.target_audience && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Target Audience
                  </h4>
                  <p className="mt-1">{project.target_audience}</p>
                </div>
              )}
              {project.desired_outcome && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Desired Outcome (OST Root)
                  </h4>
                  <p className="mt-1">{project.desired_outcome}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Continue your discovery research
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href={`/dashboard/projects/${id}/templates`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 text-blue-600 dark:text-blue-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                          </svg>
                        </div>
                        <h3 className="font-medium">Create Template</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Generate story-based interview rubric
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/dashboard/projects/${id}/interviews`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 text-green-600 dark:text-green-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                            />
                          </svg>
                        </div>
                        <h3 className="font-medium">Conduct Interview</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Start a new participant interview
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href={`/dashboard/projects/${id}/tree`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 text-purple-600 dark:text-purple-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                            />
                          </svg>
                        </div>
                        <h3 className="font-medium">View OST</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Explore opportunity solution tree
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="mt-6">
          {interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews.slice(0, 5).map((interview: { id: string; participant_name: string; status: string; created_at: string }) => (
                <Card key={interview.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">
                        {interview.participant_name || "Anonymous Participant"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          interview.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {interview.status}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/projects/${id}/interviews/${interview.id}/snapshot`}
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {interviews.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/projects/${id}/interviews`}>
                      View All Interviews
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-gray-500">No interviews yet</p>
                <Button className="mt-4" asChild>
                  <Link href={`/dashboard/projects/${id}/interviews`}>
                    Create First Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tree" className="mt-6">
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">
                View your Opportunity Solution Tree
              </p>
              <Button asChild>
                <Link href={`/dashboard/projects/${id}/tree`}>Open OST Visualization</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
