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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's projects with interview counts
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      interviews:interviews(count),
      templates:templates(count)
    `
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-500 mt-1">
            Manage your discovery research projects
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">Create Project</Link>
        </Button>
      </div>

      {/* Projects Grid */}
      {projects && projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || project.research_goals}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">
                        {(project.interviews as { count: number }[])?.[0]?.count || 0}
                      </span>{" "}
                      interviews
                    </div>
                    <div>
                      <span className="font-medium">
                        {(project.templates as { count: number }[])?.[0]?.count || 0}
                      </span>{" "}
                      templates
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                    Created{" "}
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-gray-500 mt-1">
                  Create your first project to start conducting discovery
                  interviews.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/projects/new">Create Your First Project</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teresa Torres Tip */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
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
                  d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200">
                Teresa Torres Tip
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                &ldquo;Interview weekly, not just when you have a big project. Continuous
                discovery means making talking to customers a habit, not an
                event.&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
