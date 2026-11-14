import { mastra } from "@/mastra";
import { interviewSnapshotSchema } from "@/mastra/schemas";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type SnapshotResult =
  | { ok: true; snapshot: Record<string, unknown> }
  | { ok: false; status: number; error: string };

const MIN_MESSAGES = 4;

/**
 * Runs the synthesizer over a completed interview and stores the Interview
 * Snapshot (status "pending" — a human still validates it).
 *
 * Does no authorization: callers either check project ownership first
 * (/api/synthesis) or run it as a trusted follow-up to an interview ending
 * (/api/chat, /api/interviews). `snapshots.interview_id` is unique, so a
 * concurrent second call loses the insert and gets a 409.
 */
export async function generateSnapshot(
  supabase: Supabase,
  interviewId: string
): Promise<SnapshotResult> {
  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("id, status, participant_name, messages(role, content, created_at), projects(user_id)")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    return { ok: false, status: 404, error: "Interview not found" };
  }
  if (interview.status !== "completed") {
    return { ok: false, status: 400, error: "Interview must be completed before synthesis" };
  }

  const { data: existingSnapshot } = await supabase
    .from("snapshots")
    .select("id")
    .eq("interview_id", interviewId)
    .maybeSingle();

  if (existingSnapshot) {
    return { ok: false, status: 409, error: "Snapshot already exists for this interview" };
  }

  const messages = (interview.messages || []) as {
    role: string;
    content: string;
    created_at: string;
  }[];
  if (messages.length < MIN_MESSAGES) {
    return { ok: false, status: 400, error: "Interview transcript is too short for synthesis" };
  }

  const transcript = messages
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((m) => `[${m.role === "user" ? "Participant" : "Interviewer"}] ${m.content}`)
    .join("\n\n");

  const prompt = `Analyze this interview transcript and create an Interview Snapshot:

## Interview Transcript

${transcript}

## Participant Name
${interview.participant_name || "Anonymous"}

---

Generate the Interview Snapshot JSON with experience_map, quote_reel, facts, and blind_spots.`;

  const synthesizer = mastra.getAgent("synthesizerAgent");
  const response = await synthesizer.generate(prompt, {
    structuredOutput: { schema: interviewSnapshotSchema },
  });
  const snapshot = response.object;

  // The service-role client has no auth.uid() for the user_id trigger to
  // pick up, so name the project owner explicitly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (interview.projects as any)?.user_id as string | undefined;

  const { data: savedSnapshot, error: saveError } = await supabase
    .from("snapshots")
    .insert({
      interview_id: interviewId,
      experience_map: snapshot.experience_map,
      quote_reel: snapshot.quote_reel,
      facts: snapshot.facts,
      blind_spots: snapshot.blind_spots,
      status: "pending", // Pending human validation
      ...(ownerId ? { user_id: ownerId } : {}),
    })
    .select()
    .single();

  if (saveError) {
    if (saveError.code === "23505") {
      return { ok: false, status: 409, error: "Snapshot already exists for this interview" };
    }
    console.error("Failed to save snapshot:", saveError);
    return { ok: false, status: 500, error: "Failed to save snapshot" };
  }

  return { ok: true, snapshot: savedSnapshot };
}

/**
 * Fire-and-forget variant for use inside `after()`: an interview just ended,
 * so build its snapshot without anyone waiting on it. Never throws.
 */
export async function autoGenerateSnapshot(supabase: Supabase, interviewId: string) {
  try {
    const result = await generateSnapshot(supabase, interviewId);
    // 409 = someone already generated it; 400 = too short. Neither is a fault.
    if (!result.ok && result.status >= 500) {
      console.error(`Auto-snapshot failed for interview ${interviewId}: ${result.error}`);
    }
  } catch (error) {
    console.error(`Auto-snapshot failed for interview ${interviewId}:`, error);
  }
}
