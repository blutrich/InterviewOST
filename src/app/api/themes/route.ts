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

// ============================================================================
// POST /api/themes  — regenerate the OST top layer
//
// Themes are the top layer of the Opportunity Solution Tree: cross-interview
// FINDINGS (a claim grounded in verbatim quotes), not generic topic nouns.
// This endpoint is idempotent and fully automatic — it is called whenever new
// interview data lands (after mapping) or when a tree has opportunities but no
// themes yet. There is no manual button.
//
// It (1) clears existing theme nodes (re-parenting their children back to the
// outcome), (2) clusters all leaf opportunities via the Themer agent, and
// (3) creates fresh theme nodes, re-parents the member opportunities under
// them, and attaches representative quotes as evidence.
//
// Frequency ("N of M interviews") is NOT stored — it is computed at render
// time from each theme's descendants' evidence, so it is always current and
// needs no schema change.
// ============================================================================

const regenerateSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

const themeSuggestionsSchema = z.object({
  themes: z.array(
    z.object({
      finding: z.string(),
      description: z.string().nullable().optional(),
      member_opportunity_ids: z.array(z.string()).default([]),
      representative_quotes: z
        .array(
          z.object({
            quote: z.string(),
            interview_id: z.string().nullable().optional(),
          })
        )
        .default([]),
    })
  ),
});

const LEAF_EXCLUDED_TYPES = ["outcome", "theme"];

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const identifier = getClientIdentifier(req, user!.id, "themes");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();
    const validated = regenerateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { projectId } = validated.data;

    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();

    const { data: project } = await supabase
      .from("projects")
      .select("desired_outcome, research_goals, target_audience")
      .eq("id", projectId)
      .single();

    // All opportunities for the project, with their quotes + source interview.
    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select("id, title, description, type, parent_id, evidence(quote, interview_id)")
      .eq("project_id", projectId);

    if (oppError) {
      console.error("Failed to fetch opportunities:", oppError);
      return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
    }

    const all = opportunities || [];
    const outcomeRow = all.find((o: { type: string }) => o.type === "outcome");
    const outcomeId = outcomeRow?.id ?? null;
    const existingThemes = all.filter((o: { type: string }) => o.type === "theme");
    const leaves = all.filter((o: { type: string }) => !LEAF_EXCLUDED_TYPES.includes(o.type));

    // Not enough to cluster — leave the tree as-is (don't error; this is auto-called).
    if (leaves.length < 2) {
      return NextResponse.json({ success: true, themesCreated: 0, skipped: "not enough opportunities" });
    }

    // --- Cluster the leaves into findings ---
    const leafIds = new Set(leaves.map((o: { id: string }) => o.id));
    const leavesContext = leaves
      .map((o: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        evidence?: Array<{ quote: string; interview_id: string | null }>;
      }) => {
        const quotes = (o.evidence || [])
          .slice(0, 3)
          .map((e) => `      - "${e.quote}" (interview_id: ${e.interview_id ?? "unknown"})`)
          .join("\n");
        return `- id: ${o.id}
    title: ${o.title}
    type: ${o.type}
    description: ${o.description || "(none)"}
    quotes:\n${quotes || "      (no quotes)"}`;
      })
      .join("\n");

    const prompt = `Cluster these interview opportunities into 4-6 Themes for the Opportunity Solution Tree.

## Project Context
Desired outcome (OST root): ${project?.desired_outcome || "(not set)"}
Research goal: ${project?.research_goals || "(not set)"}
Target audience: ${project?.target_audience || "(not set)"}

## Leaf Opportunities (cluster ALL of these)
${leavesContext}

---

Return ONLY the JSON object described in your instructions (themes[] with finding, description, member_opportunity_ids using the exact ids above, and representative_quotes with their interview_id).`;

    const themer = mastra.getAgent("themerAgent");
    const response = await themer.generate(prompt);

    let suggestions;
    try {
      const text = response.text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      const jsonStr = jsonMatch[1] || text;
      suggestions = themeSuggestionsSchema.parse(JSON.parse(jsonStr.trim()));
    } catch (parseError) {
      console.error("Failed to parse themer response:", parseError);
      console.error("Raw response:", response.text);
      return NextResponse.json({ error: "Failed to parse theme suggestions" }, { status: 500 });
    }

    // --- Idempotent reset: detach children of old themes, then delete old themes ---
    if (existingThemes.length > 0) {
      const oldThemeIds = existingThemes.map((t: { id: string }) => t.id);
      // Re-parent any children of old themes back to the outcome (FK is RESTRICT).
      await supabase
        .from("opportunities")
        .update({ parent_id: outcomeId })
        .in("parent_id", oldThemeIds);
      // Delete the old theme nodes (their evidence cascades).
      await supabase.from("opportunities").delete().in("id", oldThemeIds);
    }

    // --- Create the fresh theme layer ---
    let themesCreated = 0;
    for (let t = 0; t < suggestions.themes.length; t++) {
      const theme = suggestions.themes[t];
      const memberIds = theme.member_opportunity_ids.filter((id) => leafIds.has(id));
      const themeX = 120 + t * 340;

      const { data: themeRow, error: themeError } = await supabase
        .from("opportunities")
        .insert({
          project_id: projectId,
          parent_id: outcomeId,
          title: theme.finding,
          description: theme.description ?? null,
          type: "theme",
          status: "approved",
          position: { x: themeX, y: 220 },
        })
        .select()
        .single();

      if (themeError || !themeRow) {
        console.error("Failed to create theme:", themeError);
        continue;
      }
      themesCreated++;

      // Re-parent member leaf opportunities under the theme.
      for (let i = 0; i < memberIds.length; i++) {
        await supabase
          .from("opportunities")
          .update({ parent_id: themeRow.id, position: { x: themeX + i * 30, y: 440 + i * 120 } })
          .eq("id", memberIds[i])
          .eq("project_id", projectId);
      }

      // Attach representative quotes as evidence (interview_id left null — these
      // are theme-level illustrations; the frequency comes from the children).
      const evidenceRows = (theme.representative_quotes || [])
        .filter((q) => q.quote)
        .map((q) => ({
          opportunity_id: themeRow.id,
          interview_id: null,
          snapshot_id: null,
          quote: q.quote,
        }));
      if (evidenceRows.length > 0) {
        const { error: evError } = await supabase.from("evidence").insert(evidenceRows);
        if (evError) console.error("Failed to insert theme evidence:", evError);
      }
    }

    return NextResponse.json({ success: true, themesCreated });
  } catch (error) {
    console.error("Themes regenerate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
