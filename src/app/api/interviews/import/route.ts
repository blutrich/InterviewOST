import { NextResponse } from "next/server";
import {
  createClient,
  createServiceClient,
  getAuthenticatedUser,
  verifyBearerToken,
  verifyProjectOwnership,
} from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { z } from "zod";

// POST /api/interviews/import
// Create a `completed` interview from an existing transcript (paste), then
// store it as messages so the normal synthesis -> snapshot -> OST pipeline
// works on it unchanged. Accepts session auth (UI) or Bearer service-role key.

const importSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  participantName: z.string().max(100, "Name too long").optional(),
  transcript: z
    .string()
    .trim()
    .min(20, "Transcript is too short to import")
    .max(100_000, "Transcript is too long (max 100k characters)"),
});

// Labels that mean "this turn is the interviewer", not the participant.
const INTERVIEWER_HINT =
  /\b(interview|research|moderat|facilitat|host|agent|assistant|ava|\bai\b|bot)/i;

// "Name:" / "Name (00:12):" / "Name [00:12]:" — colon-delimited only, to avoid
// mis-splitting ordinary sentences that contain a dash.
const SPEAKER_RE =
  /^([A-Za-z][\w .'-]{0,38}?)\s*(?:\([^)]*\)|\[[^\]]*\])?\s*:\s+(.+)$/;

type ParsedMessage = { role: "user" | "assistant"; content: string };

function parseTranscript(raw: string): ParsedMessage[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const messages: ParsedMessage[] = [];
  for (const line of lines) {
    const m = line.match(SPEAKER_RE);
    if (m && m[2].trim()) {
      const role: "user" | "assistant" = INTERVIEWER_HINT.test(m[1])
        ? "assistant"
        : "user";
      messages.push({ role, content: m[2].trim() });
    } else if (messages.length) {
      // Unlabeled line — treat as a continuation of the previous turn.
      messages[messages.length - 1].content += " " + line;
    } else {
      messages.push({ role: "user", content: line });
    }
  }

  // Fallback: no usable speaker structure. Split into sentences (alternating
  // roles) so synthesis — which requires >= 4 messages — still has material.
  if (messages.length < 4) {
    const parts = raw
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > messages.length) {
      return parts.map((content, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content,
      }));
    }
  }

  return messages;
}

export async function POST(req: Request) {
  try {
    const isBearerAuth = verifyBearerToken(req);

    const body = await req.json();
    const validated = importSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    const { projectId, participantName, transcript } = validated.data;

    if (!isBearerAuth) {
      const { user, error: authError } = await getAuthenticatedUser();
      if (authError) return authError;
      const { authorized, error: ownershipError } =
        await verifyProjectOwnership(projectId, user!.id);
      if (!authorized) {
        return NextResponse.json({ error: ownershipError }, { status: 403 });
      }
    }

    const supabase = isBearerAuth
      ? await createServiceClient()
      : await createClient();

    const parsed = parseTranscript(transcript);
    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "Could not read any text from the transcript" },
        { status: 400 },
      );
    }

    // Attach the active template if one exists (informational for imports).
    let templateId: string | undefined;
    const { data: activeTemplate } = await supabase
      .from("templates")
      .select("id")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .single();
    if (activeTemplate) templateId = activeTemplate.id;

    const accessToken = nanoid(12);
    const now = new Date().toISOString();

    const { data: interview, error } = await supabase
      .from("interviews")
      .insert({
        project_id: projectId,
        template_id: templateId,
        access_token: accessToken,
        participant_name: participantName || null,
        status: "completed",
        started_at: now,
        completed_at: now,
      })
      .select()
      .single();

    if (error || !interview) {
      console.error("Database error (import interview):", error);
      return NextResponse.json(
        { error: "Failed to create interview" },
        { status: 500 },
      );
    }

    const rows = parsed.map((m) => ({
      interview_id: interview.id,
      role: m.role,
      content: m.content,
    }));
    const { error: msgError } = await supabase.from("messages").insert(rows);
    if (msgError) {
      console.error("Database error (import messages):", msgError);
      // Roll back so we don't leave an empty completed interview behind.
      await supabase.from("interviews").delete().eq("id", interview.id);
      return NextResponse.json(
        { error: "Failed to save transcript" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ...interview, message_count: rows.length, imported: true });
  } catch (error) {
    console.error("Import interview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
