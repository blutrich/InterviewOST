import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// ============================================================
// Logging helpers
// ============================================================

const LOG = "[recommendations]";

/**
 * Format a Supabase / PostgrestError into a JSON-safe object with all the
 * fields the caller needs to diagnose. Supabase errors are NOT plain Error
 * instances — they have code/details/hint/message and JSON.stringify on the
 * raw value misses them.
 */
function describeDbError(err: unknown): Record<string, unknown> {
  if (!err || typeof err !== "object") return { raw: String(err) };
  const e = err as { code?: string; details?: string; hint?: string; message?: string; name?: string; stack?: string };
  return {
    code: e.code,
    message: e.message,
    details: e.details,
    hint: e.hint,
    name: e.name,
    // Only include the first line of the stack to keep logs readable
    stack: e.stack?.split("\n").slice(0, 3).join("\n"),
  };
}

/**
 * Detect the "table does not exist" error from Postgres so we can give the
 * deployer a helpful message instead of a generic 500.
 */
function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  // 42P01 = undefined_table
  if (e.code === "42P01") return true;
  if (e.message && /relation .*recommendations.* does not exist/i.test(e.message)) return true;
  return false;
}

// ============================================================
// Schemas
// ============================================================

const RECOMMENDATION_TYPES = ["solid", "bold", "moonshot", "standalone"] as const;

const generateSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  opportunityId: z.string().uuid("Invalid opportunity ID"),
});

const updateSchema = z.object({
  recommendationId: z.string().uuid("Invalid recommendation ID"),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  human_notes: z.string().max(5000, "Notes too long").optional(),
});

// Validated shape of the agent's JSON output
const recommendationSchema = z.object({
  type: z.enum(RECOMMENDATION_TYPES),
  title: z.string().min(1).max(200),
  explanation: z.string().min(1).max(4000),
  rationale: z.string().min(1).max(4000),
  supporting_examples: z.array(z.string().min(1).max(2000)).min(1),
  expected_value: z.string().min(1).max(2000),
  call_to_action: z.string().min(1).max(1000),
});

const agentOutputSchema = z.object({
  recommendations: z
    .array(recommendationSchema)
    .min(4, "Agent must return all 4 tiers"),
});

// ============================================================
// GET — list recommendations for a project (optionally filter by opportunity)
// ============================================================

export async function GET(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const opportunityId = searchParams.get("opportunityId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();
    let query = supabase
      .from("recommendations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (opportunityId) {
      query = query.eq("opportunity_id", opportunityId);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`${LOG} GET fetch error`, describeDbError(error));
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            error: "The `recommendations` table does not exist. Apply migration 007_recommendations.sql to your Supabase instance.",
            db: describeDbError(error),
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch recommendations", db: describeDbError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`${LOG} GET unexpected error`, error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — generate 4 recommendations for a single theme
// ============================================================

export async function POST(req: Request) {
  const t0 = Date.now();
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) {
      console.warn(`${LOG} POST auth failed`);
      return authError;
    }
    console.log(`${LOG} POST start | user=${user!.id}`);

    // Rate limit: AI-tier (10 / min)
    const identifier = getClientIdentifier(req, user!.id, "recommendations");
    const rl = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rl.success) {
      console.warn(`${LOG} POST rate-limited | user=${user!.id}`);
      return rateLimitResponse(rl);
    }

    const body = await req.json();
    const validated = generateSchema.safeParse(body);
    if (!validated.success) {
      console.warn(`${LOG} POST invalid input`, validated.error.errors);
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { projectId, opportunityId } = validated.data;
    console.log(`${LOG} POST input | project=${projectId} theme=${opportunityId}`);

    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      console.warn(`${LOG} POST forbidden | user=${user!.id} project=${projectId} reason=${ownershipError}`);
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch the theme opportunity
    const { data: theme, error: themeError } = await supabase
      .from("opportunities")
      .select("id, title, description, type, project_id")
      .eq("id", opportunityId)
      .single();

    if (themeError || !theme) {
      console.warn(`${LOG} POST theme not found`, describeDbError(themeError));
      return NextResponse.json(
        { error: "Theme opportunity not found", db: describeDbError(themeError) },
        { status: 404 }
      );
    }
    if (theme.project_id !== projectId) {
      console.warn(`${LOG} POST theme/project mismatch | theme.project_id=${theme.project_id} requested=${projectId}`);
      return NextResponse.json({ error: "Theme does not belong to project" }, { status: 400 });
    }

    // Fetch project context for the agent
    const { data: project, error: projectFetchError } = await supabase
      .from("projects")
      .select("name, research_goals, target_audience, desired_outcome")
      .eq("id", projectId)
      .single();

    if (projectFetchError || !project) {
      console.warn(`${LOG} POST project not found`, describeDbError(projectFetchError));
      return NextResponse.json(
        { error: "Project not found", db: describeDbError(projectFetchError) },
        { status: 404 }
      );
    }

    // Fetch sub-opportunities under this theme (one level deep is enough; the
    // theme already represents a cluster — we don't recurse further to keep
    // the prompt focused and the cost predictable).
    const { data: subOpportunities, error: subError } = await supabase
      .from("opportunities")
      .select("id, title, description, type, status")
      .eq("project_id", projectId)
      .eq("parent_id", opportunityId);

    if (subError) {
      console.warn(`${LOG} POST sub-opportunities fetch error (continuing)`, describeDbError(subError));
    }

    const subIds = (subOpportunities || []).map((o) => o.id);
    const evidenceTargetIds = [opportunityId, ...subIds];

    // Fetch evidence linked to the theme or its children
    const { data: evidence, error: evidenceError } = await supabase
      .from("evidence")
      .select("quote, context, interview_id")
      .in("opportunity_id", evidenceTargetIds);

    if (evidenceError) {
      console.warn(`${LOG} POST evidence fetch error (continuing)`, describeDbError(evidenceError));
    }

    console.log(
      `${LOG} POST context | theme="${theme.title}" subs=${subIds.length} evidence=${evidence?.length ?? 0}`
    );

    // Build the prompt
    const subSection =
      subOpportunities && subOpportunities.length > 0
        ? `\n## Sub-opportunities under this theme\n${subOpportunities
            .map((o) => `- ${o.title}${o.description ? ` — ${o.description}` : ""} (${o.type})`)
            .join("\n")}`
        : "";

    const evidenceSection =
      evidence && evidence.length > 0
        ? `\n## Interview Evidence\n${evidence
            .map((e, i) => `${i + 1}. "${e.quote}"${e.context ? ` — context: ${e.context}` : ""}`)
            .join("\n")}`
        : `\n## Interview Evidence\n(No evidence rows linked to this theme yet — base your recommendations on the theme + project context, and note the evidence gap in the rationale.)`;

    const prompt = `Generate 4 product recommendations (solid, bold, moonshot, standalone) for the following theme.

## Theme
**Title:** ${theme.title}
${theme.description ? `**Description:** ${theme.description}` : ""}
${subSection}

## Project Context
- **Product / Project name:** ${project.name}
- **Research Goals:** ${project.research_goals}
- **Target Audience:** ${project.target_audience || "Not specified"}
- **Desired Outcome:** ${project.desired_outcome || "Not specified"}
${evidenceSection}

---

Return ONLY a JSON object with the exact shape specified in your system instructions:

{
  "recommendations": [
    { "type": "solid",      "title": "...", "explanation": "...", "rationale": "...", "supporting_examples": ["..."], "expected_value": "...", "call_to_action": "..." },
    { "type": "bold",       ... },
    { "type": "moonshot",   ... },
    { "type": "standalone", ... }
  ]
}`;

    // Call the recommender agent
    const tAgent = Date.now();
    const recommender = mastra.getAgent("recommenderAgent");
    let response;
    try {
      response = await recommender.generate(prompt);
    } catch (agentErr) {
      console.error(`${LOG} POST agent.generate threw`, agentErr);
      return NextResponse.json(
        {
          error: "Agent failed to generate recommendations",
          message: agentErr instanceof Error ? agentErr.message : String(agentErr),
        },
        { status: 502 }
      );
    }
    console.log(`${LOG} POST agent ok | ms=${Date.now() - tAgent} chars=${response.text?.length ?? 0}`);

    // Parse and validate the agent's output
    let parsed;
    try {
      const text = response.text;
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = fenced ? fenced[1] : text;
      const raw = JSON.parse(jsonStr.trim());
      parsed = agentOutputSchema.parse(raw);
    } catch (parseError) {
      console.error(`${LOG} POST parse failed`, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        raw_preview: response.text?.slice(0, 1500),
      });
      return NextResponse.json(
        {
          error: "Failed to parse recommendation output. Try regenerating.",
          message: parseError instanceof Error ? parseError.message : String(parseError),
          raw_preview: response.text?.slice(0, 500),
        },
        { status: 502 }
      );
    }

    // Verify all 4 tiers are present
    const tiersPresent = new Set(parsed.recommendations.map((r) => r.type));
    const missing = RECOMMENDATION_TYPES.filter((t) => !tiersPresent.has(t));
    if (missing.length > 0) {
      console.warn(`${LOG} POST agent missed tiers`, { missing, returned: [...tiersPresent] });
      return NextResponse.json(
        { error: `Agent omitted tiers: ${missing.join(", ")}. Try regenerating.` },
        { status: 502 }
      );
    }

    // Build the rows. Explicit user_id avoids depending on the
    // set_user_id_from_auth trigger if it isn't installed in this Supabase
    // instance (e.g. migration 003 was skipped) or hasn't fired correctly.
    const rows = parsed.recommendations.map((r) => ({
      project_id: projectId,
      opportunity_id: opportunityId,
      user_id: user!.id,
      type: r.type,
      title: r.title,
      explanation: r.explanation,
      rationale: r.rationale,
      supporting_examples: r.supporting_examples,
      expected_value: r.expected_value,
      call_to_action: r.call_to_action,
      status: "pending" as const,
    }));

    console.log(`${LOG} POST inserting ${rows.length} rows`);

    const { data: inserted, error: upsertError } = await supabase
      .from("recommendations")
      .upsert(rows, { onConflict: "opportunity_id,type" })
      .select();

    if (upsertError) {
      const db = describeDbError(upsertError);
      console.error(`${LOG} POST upsert failed`, {
        db,
        sample_row: {
          project_id: rows[0].project_id,
          opportunity_id: rows[0].opportunity_id,
          user_id: rows[0].user_id,
          type: rows[0].type,
          title: rows[0].title,
          supporting_examples_count: rows[0].supporting_examples.length,
        },
      });

      if (isMissingTableError(upsertError)) {
        return NextResponse.json(
          {
            error: "Migration not applied: the `recommendations` table does not exist. Run supabase/migrations/007_recommendations.sql against this database.",
            db,
          },
          { status: 500 }
        );
      }

      // Surface the actual DB error so the network tab is useful for debugging.
      return NextResponse.json(
        {
          error: "Failed to save recommendations",
          db, // { code, message, details, hint }
        },
        { status: 500 }
      );
    }

    console.log(`${LOG} POST done | ms_total=${Date.now() - t0} inserted=${inserted?.length ?? 0}`);
    return NextResponse.json({ success: true, recommendations: inserted });
  } catch (error) {
    console.error(`${LOG} POST unexpected error`, {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5).join("\n") : undefined,
      elapsed_ms: Date.now() - t0,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — approve / reject / annotate a recommendation
// ============================================================

export async function PATCH(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await req.json();
    const validated = updateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { recommendationId, status, human_notes } = validated.data;

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("recommendations")
      .select("id, project_id")
      .eq("id", recommendationId)
      .single();

    if (fetchError || !existing) {
      console.warn(`${LOG} PATCH not found`, describeDbError(fetchError));
      return NextResponse.json(
        { error: "Recommendation not found", db: describeDbError(fetchError) },
        { status: 404 }
      );
    }

    const { authorized, error: ownershipError } = await verifyProjectOwnership(existing.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      updates.status = status;
      if (status === "approved" || status === "rejected") {
        updates.validated_at = new Date().toISOString();
        updates.validated_by = user!.id;
      }
    }
    if (human_notes !== undefined) updates.human_notes = human_notes;

    const { data, error } = await supabase
      .from("recommendations")
      .update(updates)
      .eq("id", recommendationId)
      .select()
      .single();

    if (error) {
      console.error(`${LOG} PATCH update failed`, describeDbError(error));
      return NextResponse.json(
        { error: "Failed to update recommendation", db: describeDbError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, recommendation: data });
  } catch (error) {
    console.error(`${LOG} PATCH unexpected error`, error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE — remove a recommendation
// ============================================================

export async function DELETE(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const recommendationId = searchParams.get("id");
    if (!recommendationId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from("recommendations")
      .select("id, project_id")
      .eq("id", recommendationId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Recommendation not found", db: describeDbError(fetchError) },
        { status: 404 }
      );
    }

    const { authorized, error: ownershipError } = await verifyProjectOwnership(existing.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { error } = await supabase.from("recommendations").delete().eq("id", recommendationId);
    if (error) {
      console.error(`${LOG} DELETE failed`, describeDbError(error));
      return NextResponse.json(
        { error: "Failed to delete recommendation", db: describeDbError(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`${LOG} DELETE unexpected error`, error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
