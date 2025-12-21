import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ interviewId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { interviewId } = await params;
    const supabase = await createClient();

    // Fetch interview details with project_id for authorization
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("id, participant_name, created_at, status, started_at, completed_at, project_id")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(interview.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Remove project_id from response
    const { project_id, ...interviewWithoutProjectId } = interview;

    return NextResponse.json({
      ...interviewWithoutProjectId,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Error in messages API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
