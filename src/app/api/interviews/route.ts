import { NextResponse } from "next/server";
import { createClient, createServiceClient, getAuthenticatedUser, verifyBearerToken, verifyProjectOwnership } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { z } from "zod";

// Validation schemas
const createInterviewSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  templateId: z.string().uuid("Invalid template ID").optional(),
  participantName: z.string().max(100, "Name too long").optional(),
});

const updateInterviewSchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID"),
  status: z.enum(["pending", "active", "completed"]).optional(),
  participantName: z.string().max(100, "Name too long").optional(),
});

// GET - List interviews for a project
export async function GET(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: interviews, error } = await supabase
      .from("interviews")
      .select(`
        *,
        templates(name),
        snapshots(id, status),
        messages(id)
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
    }

    // Add message count and snapshot info
    const enrichedInterviews = interviews.map((interview) => ({
      ...interview,
      message_count: interview.messages?.length || 0,
      has_snapshot: interview.snapshots && interview.snapshots.length > 0,
      snapshot_status: interview.snapshots?.[0]?.status,
      template_name: interview.templates?.name,
    }));

    return NextResponse.json(enrichedInterviews);
  } catch (error) {
    console.error("Get interviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new interview
// Accepts session auth (UI) or Bearer <SUPABASE_SERVICE_ROLE_KEY> (integrations)
export async function POST(req: Request) {
  try {
    const isBearerAuth = verifyBearerToken(req);

    const body = await req.json();
    const validated = createInterviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { projectId, templateId, participantName } = validated.data;

    if (!isBearerAuth) {
      const { user, error: authError } = await getAuthenticatedUser();
      if (authError) return authError;

      const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
      if (!authorized) {
        return NextResponse.json({ error: ownershipError }, { status: 403 });
      }
    }

    // Bearer auth uses service client (bypasses RLS); session auth uses regular client
    const supabase = isBearerAuth ? await createServiceClient() : await createClient();

    let finalTemplateId = templateId;
    if (!finalTemplateId) {
      const { data: activeTemplate } = await supabase
        .from("templates")
        .select("id")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .single();

      if (activeTemplate) {
        finalTemplateId = activeTemplate.id;
      }
    }

    const accessToken = nanoid(12);

    const { data: interview, error } = await supabase
      .from("interviews")
      .insert({
        project_id: projectId,
        template_id: finalTemplateId,
        access_token: accessToken,
        participant_name: participantName || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const interviewLink = `${baseUrl}/i/${accessToken}`;

    return NextResponse.json({
      ...interview,
      interview_link: interviewLink,
    });
  } catch (error) {
    console.error("Create interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update interview status
export async function PATCH(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Validate input
    const body = await req.json();
    const validated = updateInterviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { interviewId, status, participantName } = validated.data;

    const supabase = await createClient();

    // Fetch interview to verify ownership
    const { data: existingInterview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, project_id")
      .eq("id", interviewId)
      .single();

    if (fetchError || !existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(existingInterview.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      updates.status = status;
      if (status === "active") {
        updates.started_at = new Date().toISOString();
      } else if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (participantName !== undefined) {
      updates.participant_name = participantName;
    }

    const { data: interview, error } = await supabase
      .from("interviews")
      .update(updates)
      .eq("id", interviewId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Update interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove an interview
export async function DELETE(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch interview to verify ownership
    const { data: existingInterview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, project_id")
      .eq("id", interviewId)
      .single();

    if (fetchError || !existingInterview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(existingInterview.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { error } = await supabase
      .from("interviews")
      .delete()
      .eq("id", interviewId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to delete interview" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
