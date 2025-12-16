import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import InterviewActions from "./InterviewActions";
import CopyLinkButton from "./CopyLinkButton";

interface Props {
  params: Promise<{ id: string; interviewId: string }>;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default async function InterviewDetailPage({ params }: Props) {
  const { id: projectId, interviewId } = await params;
  const supabase = await createClient();

  // Fetch interview with messages and project
  const { data: interview, error } = await supabase
    .from("interviews")
    .select(`
      *,
      projects(name),
      templates(name, rubric),
      snapshots(id, status)
    `)
    .eq("id", interviewId)
    .single();

  if (error || !interview) {
    notFound();
  }

  // Fetch messages separately for better ordering
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });

  const hasSnapshot = interview.snapshots && interview.snapshots.length > 0;
  const snapshot = interview.snapshots?.[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "active":
        return "bg-blue-600";
      case "abandoned":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-gray-900">
              Projects
            </Link>
            <span>/</span>
            <Link href={`/dashboard/projects/${projectId}`} className="hover:text-gray-900">
              {interview.projects?.name}
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/projects/${projectId}/interviews`}
              className="hover:text-gray-900"
            >
              Interviews
            </Link>
            <span>/</span>
            <span className="text-gray-900">Transcript</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {interview.participant_name || "Anonymous Participant"}
            </h1>
            <Badge className={getStatusColor(interview.status)}>
              {interview.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">
            {interview.templates?.name || "No template"} | Created{" "}
            {new Date(interview.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/projects/${projectId}/interviews`}>
              Back to Interviews
            </Link>
          </Button>
          {interview.status === "completed" && (
            <Button asChild>
              <Link
                href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`}
              >
                {hasSnapshot ? "View Snapshot" : "Generate Snapshot"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Interview Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{messages?.length || 0}</div>
            <p className="text-sm text-gray-500">Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {interview.started_at
                ? new Date(interview.started_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
            <p className="text-sm text-gray-500">Started</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {interview.completed_at
                ? new Date(interview.completed_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {interview.started_at && interview.completed_at
                ? `${Math.round(
                    (new Date(interview.completed_at).getTime() -
                      new Date(interview.started_at).getTime()) /
                      60000
                  )} min`
                : "-"}
            </div>
            <p className="text-sm text-gray-500">Duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions for active interviews */}
      {interview.status === "active" && (
        <InterviewActions interviewId={interviewId} projectId={projectId} />
      )}

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          {messages && messages.length > 0 ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "assistant" ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "assistant"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium ${
                            message.role === "assistant"
                              ? "text-gray-500"
                              : "text-blue-100"
                          }`}
                        >
                          {message.role === "assistant"
                            ? "Interviewer"
                            : "Participant"}
                        </span>
                        <span
                          className={`text-xs ${
                            message.role === "assistant"
                              ? "text-gray-400"
                              : "text-blue-200"
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No messages yet</p>
              {interview.status === "pending" && (
                <p className="text-sm mt-2">
                  The interview hasn&apos;t started. Share the interview link with
                  the participant.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Link (for pending interviews) */}
      {interview.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded font-mono text-sm">
                {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/
                {interview.access_token}
              </code>
              <CopyLinkButton
                link={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/${interview.access_token}`}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Share this link with your participant to start the interview.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Snapshot Status */}
      {hasSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Interview Snapshot
              <Badge
                variant={snapshot.status === "approved" ? "default" : "secondary"}
              >
                {snapshot.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              {snapshot.status === "approved"
                ? "This interview has been analyzed and the snapshot has been approved."
                : "A snapshot has been generated. Review and approve it to add insights to your Opportunity Solution Tree."}
            </p>
            <Button asChild>
              <Link
                href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`}
              >
                View Snapshot
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
