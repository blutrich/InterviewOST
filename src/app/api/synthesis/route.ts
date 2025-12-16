import { createServiceClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { z } from "zod";

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
});

export async function POST(req: Request) {
  try {
    const { interviewId } = await req.json();

    if (!interviewId) {
      return new Response("Interview ID is required", { status: 400 });
    }

    const supabase = await createServiceClient();

    // Fetch the interview with messages
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("*, messages(*)")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return new Response("Interview not found", { status: 404 });
    }

    if (interview.status !== "completed") {
      return new Response("Interview must be completed before synthesis", {
        status: 400,
      });
    }

    // Check if snapshot already exists
    const { data: existingSnapshot } = await supabase
      .from("snapshots")
      .select("id")
      .eq("interview_id", interviewId)
      .single();

    if (existingSnapshot) {
      return new Response("Snapshot already exists for this interview", {
        status: 409,
      });
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
      return new Response("Interview transcript is too short for synthesis", {
        status: 400,
      });
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

Generate the Interview Snapshot JSON with experience_map, quote_reel, facts, and blind_spots.`;

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
        status: "pending", // Pending human validation
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save snapshot:", saveError);
      return new Response("Failed to save snapshot", { status: 500 });
    }

    return Response.json({
      success: true,
      snapshot: savedSnapshot,
    });
  } catch (error) {
    console.error("Synthesis API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// GET endpoint to fetch existing snapshot
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get("interviewId");

    if (!interviewId) {
      return new Response("Interview ID is required", { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: snapshot, error } = await supabase
      .from("snapshots")
      .select("*")
      .eq("interview_id", interviewId)
      .single();

    if (error || !snapshot) {
      return new Response("Snapshot not found", { status: 404 });
    }

    return Response.json(snapshot);
  } catch (error) {
    console.error("Snapshot fetch error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// PATCH endpoint to validate/update snapshot
export async function PATCH(req: Request) {
  try {
    const { snapshotId, status, human_notes } = await req.json();

    if (!snapshotId) {
      return new Response("Snapshot ID is required", { status: 400 });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return new Response("Invalid status", { status: 400 });
    }

    const supabase = await createServiceClient();

    // Get current user for validation tracking
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updateData: Record<string, unknown> = {
      status,
      human_notes,
    };

    if (status === "approved" || status === "rejected") {
      updateData.validated_at = new Date().toISOString();
      updateData.validated_by = user?.id;
    }

    const { data: updatedSnapshot, error } = await supabase
      .from("snapshots")
      .update(updateData)
      .eq("id", snapshotId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update snapshot:", error);
      return new Response("Failed to update snapshot", { status: 500 });
    }

    return Response.json({
      success: true,
      snapshot: updatedSnapshot,
    });
  } catch (error) {
    console.error("Snapshot update error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
