import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// GET - List interviews for a project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
export async function POST(req: Request) {
  try {
    const { projectId, templateId, participantName } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // If no templateId provided, try to get the active template
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

    // Generate a unique access token
    const accessToken = nanoid(12);

    // Create the interview
    const serviceClient = await createServiceClient();
    const { data: interview, error } = await serviceClient
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate the interview link
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
    const { interviewId, status, participantName } = await req.json();

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID required" }, { status: 400 });
    }

    const supabase = await createClient();

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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("interviews")
      .delete()
      .eq("id", interviewId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
