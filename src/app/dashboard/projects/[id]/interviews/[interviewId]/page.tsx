import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditableInterviewName } from "./EditableInterviewName";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-landing-forest/10 text-landing-forest";
      case "active":
        return "bg-landing-terracotta/10 text-landing-terracotta";
      case "abandoned":
        return "bg-red-100 text-red-700";
      default:
        return "bg-landing-stone/10 text-landing-stone";
    }
  };

  const stats = [
    { label: "Messages", value: messages?.length || 0 },
    {
      label: "Started",
      value: interview.started_at
        ? new Date(interview.started_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-"
    },
    {
      label: "Completed",
      value: interview.completed_at
        ? new Date(interview.completed_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-"
    },
    {
      label: "Duration",
      value: interview.started_at && interview.completed_at
        ? `${Math.round(
            (new Date(interview.completed_at).getTime() -
              new Date(interview.started_at).getTime()) /
              60000
          )} min`
        : "-"
    },
  ];

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
          <Link
            href={`/dashboard/projects/${projectId}/interviews`}
            className="hover:text-landing-charcoal transition-colors"
          >
            Interviews
          </Link>
          <span className="text-landing-stone/40">/</span>
          <span className="text-landing-charcoal">Transcript</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <EditableInterviewName interviewId={interview.id} initialName={interview.participant_name} />

              <span className={`text-[10px] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full ${getStatusStyle(interview.status)}`}>
                {interview.status}
              </span>
            </div>
            <p className="text-landing-stone">
              {interview.templates?.name || "No template"} • Created{" "}
              {new Date(interview.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/projects/${projectId}/interviews`}
              className="h-10 px-5 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
            >
              Back to Interviews
            </Link>
            {interview.status === "completed" && (
              <Link
                href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`}
                className="h-10 px-5 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 flex items-center"
              >
                {hasSnapshot ? "View Snapshot" : "Generate Snapshot"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl border border-landing-charcoal/5 p-6">
            <p className="text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-light text-landing-charcoal">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Actions for active interviews */}
      {interview.status === "active" && (
        <InterviewActions interviewId={interviewId} projectId={projectId} />
      )}

      {/* Transcript */}
      <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
            Transcript
          </h2>
        </div>
        <div className="p-8">
          {messages && messages.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto pr-4 space-y-4">
              {messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      message.role === "assistant"
                        ? "bg-landing-ivory text-landing-charcoal"
                        : "bg-landing-forest text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-medium ${
                          message.role === "assistant"
                            ? "text-landing-stone"
                            : "text-white/70"
                        }`}
                      >
                        {message.role === "assistant"
                          ? "Interviewer"
                          : "Participant"}
                      </span>
                      <span
                        className={`text-[10px] ${
                          message.role === "assistant"
                            ? "text-landing-stone/60"
                            : "text-white/50"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-landing-forest/5 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-landing-charcoal mb-2">No messages yet</h3>
              {interview.status === "pending" && (
                <p className="text-landing-stone">
                  The interview hasn&apos;t started. Share the interview link with the participant.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interview Link (for pending interviews) */}
      {interview.status === "pending" && (
        <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-8">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-4">
            Interview Link
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl font-mono text-sm text-landing-charcoal flex items-center overflow-hidden">
              <span className="truncate">
                {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/
                {interview.access_token}
              </span>
            </div>
            <CopyLinkButton
              link={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/${interview.access_token}`}
            />
          </div>
          <p className="text-sm text-landing-stone mt-3">
            Share this link with your participant to start the interview.
          </p>
        </div>
      )}

      {/* Snapshot Status */}
      {hasSnapshot && (
        <div className="relative bg-landing-charcoal rounded-3xl p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full border border-white/5 translate-x-1/4 -translate-y-1/4" />

          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
                  Interview Snapshot
                </p>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${
                  snapshot.status === "approved"
                    ? "bg-landing-forest/20 text-landing-forest"
                    : "bg-landing-terracotta/20 text-landing-terracotta"
                }`}>
                  {snapshot.status}
                </span>
              </div>
              <p className="text-white/80">
                {snapshot.status === "approved"
                  ? "This interview has been analyzed and approved."
                  : "Review and approve to add insights to your OST."}
              </p>
            </div>
            <Link
              href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`}
              className="h-10 px-6 bg-white text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-mist transition-all duration-300 flex items-center gap-2"
            >
              View Snapshot
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
