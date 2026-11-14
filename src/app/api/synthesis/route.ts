import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { generateSnapshot } from "@/lib/snapshots";
import { z } from "zod";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// Input validation schemas
const generateSnapshotSchema = z.object({
  interviewId: z.string().uuid("Invalid interview ID"),
});

const updateSnapshotSchema = z.object({
  snapshotId: z.string().uuid("Invalid snapshot ID"),
  status: z.enum(["approved", "rejected", "pending"]),
  human_notes: z.string().max(5000, "Notes too long").optional(),
});

export async function POST(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limiting - use user ID as identifier for authenticated endpoints
    const identifier = getClientIdentifier(req, user!.id, "synthesis");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Validate input
    const body = await req.json();
    const validated = generateSnapshotSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { interviewId } = validated.data;

    const supabase = await createClient();

    // Fetch the interview's project_id for authorization
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("project_id")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(interview.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const result = await generateSnapshot(supabase, interviewId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      snapshot: result.snapshot,
    });
  } catch (error) {
    console.error("Synthesis API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to fetch existing snapshot
export async function GET(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch interview to get project_id for authorization
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("project_id")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(interview.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { data: snapshot, error } = await supabase
      .from("snapshots")
      .select("*")
      .eq("interview_id", interviewId)
      .single();

    if (error || !snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Snapshot fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH endpoint to validate/update snapshot
export async function PATCH(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Validate input
    const body = await req.json();
    const validated = updateSnapshotSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { snapshotId, status, human_notes } = validated.data;

    const supabase = await createClient();

    // Fetch snapshot with interview to get project_id for authorization
    const { data: existingSnapshot, error: fetchError } = await supabase
      .from("snapshots")
      .select("id, interviews(project_id)")
      .eq("id", snapshotId)
      .single();

    if (fetchError || !existingSnapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interviewData = existingSnapshot.interviews as any;
    const projectId = interviewData?.project_id as string | undefined;
    if (projectId) {
      const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
      if (!authorized) {
        return NextResponse.json({ error: ownershipError }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {
      status,
      human_notes,
    };

    if (status === "approved" || status === "rejected") {
      updateData.validated_at = new Date().toISOString();
      updateData.validated_by = user!.id;
    }

    const { data: updatedSnapshot, error } = await supabase
      .from("snapshots")
      .update(updateData)
      .eq("id", snapshotId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update snapshot:", error);
      return NextResponse.json({ error: "Failed to update snapshot" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot: updatedSnapshot,
    });
  } catch (error) {
    console.error("Snapshot update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
