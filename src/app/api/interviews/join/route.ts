import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// Validation schema
const joinInterviewSchema = z.object({
  shareToken: z.string().min(1, "Share token required"),
  participantName: z.string().max(100, "Name too long").optional(),
});

// GET - Fetch template info by share token (public endpoint)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shareToken = searchParams.get("shareToken");

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token required" },
        { status: 400 }
      );
    }

    // Use service client to bypass RLS
    const supabase = await createServiceClient();

    // Fetch template by share_token
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, name, project_id, share_token, projects(id, name, description)")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "This interview link is invalid or has expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: template.id,
      name: template.name,
      project_id: template.project_id,
      share_token: template.share_token,
      projects: template.projects,
    });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new interview from share token (public endpoint)
export async function POST(req: Request) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(req, "", "join");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.chat);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Validate input
    const body = await req.json();
    const validated = joinInterviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { shareToken, participantName } = validated.data;

    // Use service client to bypass RLS
    const supabase = await createServiceClient();

    // Fetch template by share_token
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("id, name, project_id, share_token, projects(id, name, user_id)")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "This interview link is invalid or has expired" },
        { status: 404 }
      );
    }

    // Generate unique access token for this participant
    const accessToken = nanoid(12);

    // Get the project's user_id to associate with the interview
    const projects = template.projects as { id: string; name: string; user_id: string } | { id: string; name: string; user_id: string }[] | null;
    const projectUserId = Array.isArray(projects)
      ? projects[0]?.user_id
      : projects?.user_id;

    if (!projectUserId) {
      console.error("Project user_id not found for template:", template.id);
      return NextResponse.json(
        { error: "Failed to create interview session" },
        { status: 500 }
      );
    }

    // Create new interview using service role (bypasses RLS)
    const { data: interview, error: createError } = await supabase
      .from("interviews")
      .insert({
        project_id: template.project_id,
        template_id: template.id,
        user_id: projectUserId, // Associate with project owner
        access_token: accessToken,
        participant_name: participantName?.trim() || null,
        status: "pending",
      })
      .select("id, access_token")
      .single();

    if (createError || !interview) {
      console.error("Failed to create interview:", createError);
      return NextResponse.json(
        { error: "Failed to create interview session" },
        { status: 500 }
      );
    }

    // Return the access token for redirect
    return NextResponse.json({
      accessToken: interview.access_token,
      interviewId: interview.id,
    });
  } catch (error) {
    console.error("Join interview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
