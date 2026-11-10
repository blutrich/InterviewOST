import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// GET ?token= - Interview state + transcript for the participant page (public endpoint).
// The access token is the credential: it is validated here with the service
// client, so the browser never queries the interviews/messages tables itself.
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const identifier = getClientIdentifier(req, token, "interview-session");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.standard);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const supabase = await createServiceClient();

    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("id, status, participant_name")
      .eq("access_token", token)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("interview_id", interview.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Failed to fetch interview messages:", messagesError);
      return NextResponse.json({ error: "Failed to load interview" }, { status: 500 });
    }

    return NextResponse.json({ interview, messages: messages || [] });
  } catch (error) {
    console.error("Interview session API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
