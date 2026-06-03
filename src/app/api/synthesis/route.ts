import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
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

// Zod schema for Interview Snapshot (Teresa Torres format)
const interviewSnapshotSchema = z.object({
  experience_map: z.array(
    z.object({
      step: z.number(),
      action: z.string(),
      feeling: z.string(),
      timestamp: z.string().optional(),
    })
  ),
  quote_reel: z.array(
    z.object({
      quote: z.string(),
      context: z.string(),
      emotion: z.string(),
    })
  ),
  facts: z.object({
    role: z.string().optional(),
    tools: z.array(z.string()).optional(),
    frequency: z.string().optional(),
    context: z.string().optional(),
    other: z.record(z.any()).optional(),
  }),
  blind_spots: z.array(
    z.object({
      observation: z.string(),
      suggestion: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  // Teresa Torres "Insights" column: separate observed FACTS from your
  // INTERPRETATION of them. Each item groups one or more facts with the
  // conclusion drawn from them.
  insights: z.array(
    z.object({
      facts: z.array(z.string()),
      interpretation: z.string(),
    })
  ),
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

    // Fetch the interview with messages and project_id for authorization
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("*, messages(*), project_id")
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

    if (interview.status !== "completed") {
      return NextResponse.json({ error: "Interview must be completed before synthesis" }, { status: 400 });
    }

    // Check if snapshot already exists
    const { data: existingSnapshot } = await supabase
      .from("snapshots")
      .select("id")
      .eq("interview_id", interviewId)
      .single();

    if (existingSnapshot) {
      return NextResponse.json({ error: "Snapshot already exists for this interview" }, { status: 409 });
    }

    // Build transcript from messages
    const messages = interview.messages || [];
    const transcript = messages
      .sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map(
        (m: { role: string; content: string; created_at: string }) =>
          `[${m.role === "user" ? "Participant" : "Interviewer"}] ${m.content}`
      )
      .join("\n\n");

    if (messages.length < 4) {
      return NextResponse.json({ error: "Interview transcript is too short for synthesis" }, { status: 400 });
    }

    // Get the synthesizer agent
    const synthesizer = mastra.getAgent("synthesizerAgent");

    // Generate the Interview Snapshot with structured output
    const prompt = `Analyze this interview transcript and create an Interview Snapshot:

## Interview Transcript

${transcript}

## Participant Name
${interview.participant_name || "Anonymous"}

---

Generate the Interview Snapshot JSON with experience_map, quote_reel, facts, blind_spots, and insights.

For "insights", follow Teresa Torres' Fact-vs-Insight distinction: capture things you heard or
observed that aren't opportunities but are worth remembering. Each item lists one or more concrete
FACTS (what the participant actually said or did — observed behavior, not interpretation) and your
INTERPRETATION (the conclusion or judgment you draw from those facts). Keep facts verbatim-ish and
interpretations clearly separate.`;

    const response = await synthesizer.generate(prompt, {
      output: interviewSnapshotSchema,
    });

    const snapshot = response.object;

    // Save the snapshot to the database
    const { data: savedSnapshot, error: saveError } = await supabase
      .from("snapshots")
      .insert({
        interview_id: interviewId,
        experience_map: snapshot.experience_map,
        quote_reel: snapshot.quote_reel,
        facts: snapshot.facts,
        blind_spots: snapshot.blind_spots,
        insights: snapshot.insights,
        status: "pending", // Pending human validation
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save snapshot:", saveError);
      return NextResponse.json({ error: "Failed to save snapshot" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      snapshot: savedSnapshot,
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
