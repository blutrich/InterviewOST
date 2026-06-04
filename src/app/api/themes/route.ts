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
// /api/themes
//
// Themes are the top layer of the Opportunity Solution Tree. They are generated
// by clustering ALL of a project's leaf opportunities (cross-interview), and
// each one is a finding grounded in verbatim quotes, with a frequency derived
// from how many distinct interviews support it.
//
//   POST  -> suggest themes (Themer agent). Returns suggestions; no DB write.
//   PUT   -> apply approved themes: create `type='theme'` nodes under the
//            outcome, re-parent the member leaf opportunities, attach the
//            representative quotes as evidence, and store frequency in metadata.
//            Themes are created as `suggested` so the human curates on canvas.
// ============================================================================

const suggestSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

const applySchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  themes: z
    .array(
      z.object({
        finding: z.string().min(1, "Finding is required").max(500, "Finding too long"),
        description: z.string().max(2000).nullable().optional(),
        member_opportunity_ids: z.array(z.string()).default([]),
        representative_quotes: z
          .array(
            z.object({
              quote: z.string().min(1).max(2000),
              interview_id: z.string().nullable().optional(),
            })
          )
          .default([]),
      })
    )
    .min(1, "At least one theme is required"),
});

// Shape the Themer agent must return.
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

// ---------------------------------------------------------------------------
// POST: suggest themes from the project's leaf opportunities
// ---------------------------------------------------------------------------
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
    const validated = suggestSchema.safeParse(body);
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

    // Leaf opportunities (everything except the outcome and existing themes),
    // with their supporting quotes + source interview.
    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select("id, title, description, type, evidence(quote, interview_id)")
      .eq("project_id", projectId);

    if (oppError) {
      console.error("Failed to fetch opportunities:", oppError);
      return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
    }

    const leaves = (opportunities || []).filter(
      (o: { type: string }) => !LEAF_EXCLUDED_TYPES.includes(o.type)
    );

    if (leaves.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 opportunities to cluster into themes" },
        { status: 400 }
      );
    }

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

    // Keep only ids that actually exist as leaf opportunities.
    const leafIds = new Set(leaves.map((o: { id: string }) => o.id));
    const cleanedThemes = suggestions.themes.map((t) => ({
      ...t,
      member_opportunity_ids: t.member_opportunity_ids.filter((id) => leafIds.has(id)),
    }));

    return NextResponse.json({ success: true, projectId, themes: cleanedThemes });
  } catch (error) {
    console.error("Themes suggest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT: apply approved themes to the tree
// ---------------------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await req.json();
    const validated = applySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { projectId, themes } = validated.data;

    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();

    // Outcome row to parent themes under (null => virtual root handles it).
    const { data: outcomeRow } = await supabase
      .from("opportunities")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", "outcome")
      .maybeSingle();
    const outcomeId = outcomeRow?.id ?? null;

    // All opportunities + their interview-tagged evidence, to compute frequency.
    const { data: allOpps } = await supabase
      .from("opportunities")
      .select("id, type, evidence(interview_id)")
      .eq("project_id", projectId);

    const evidenceByOpp = new Map<string, Set<string>>();
    const allInterviewIds = new Set<string>();
    (allOpps || []).forEach((o: { id: string; evidence?: Array<{ interview_id: string | null }> }) => {
      const set = new Set<string>();
      (o.evidence || []).forEach((e) => {
        if (e.interview_id) {
          set.add(e.interview_id);
          allInterviewIds.add(e.interview_id);
        }
      });
      evidenceByOpp.set(o.id, set);
    });
    const leafIds = new Set(
      (allOpps || [])
        .filter((o: { type: string }) => !LEAF_EXCLUDED_TYPES.includes(o.type))
        .map((o: { id: string }) => o.id)
    );
    const frequencyM = allInterviewIds.size;

    // Valid interview ids (so we never insert evidence with a bad FK).
    const { data: interviewRows } = await supabase
      .from("interviews")
      .select("id")
      .eq("project_id", projectId);
    const validInterviewIds = new Set((interviewRows || []).map((i: { id: string }) => i.id));

    const createdThemes = [];

    for (let t = 0; t < themes.length; t++) {
      const theme = themes[t];
      const memberIds = theme.member_opportunity_ids.filter((id) => leafIds.has(id));

      // frequency_n = distinct interviews across this theme's members.
      const interviewsForTheme = new Set<string>();
      memberIds.forEach((id) => {
        (evidenceByOpp.get(id) || new Set<string>()).forEach((iv) => interviewsForTheme.add(iv));
      });
      const frequencyN = interviewsForTheme.size;

      const themeX = 120 + t * 340;

      // 1) Create the theme node.
      const { data: themeRow, error: themeError } = await supabase
        .from("opportunities")
        .insert({
          project_id: projectId,
          parent_id: outcomeId,
          title: theme.finding,
          description: theme.description ?? null,
          type: "theme",
          status: "suggested",
          position: { x: themeX, y: 220 },
          metadata: { frequency_n: frequencyN, frequency_m: frequencyM },
        })
        .select()
        .single();

      if (themeError || !themeRow) {
        console.error("Failed to create theme:", themeError);
        continue;
      }

      // 2) Re-parent member leaf opportunities under the theme.
      for (let i = 0; i < memberIds.length; i++) {
        await supabase
          .from("opportunities")
          .update({
            parent_id: themeRow.id,
            position: { x: themeX + i * 30, y: 440 + i * 120 },
          })
          .eq("id", memberIds[i])
          .eq("project_id", projectId);
      }

      // 3) Attach representative quotes as evidence on the theme.
      const evidenceRows = (theme.representative_quotes || [])
        .map((q) => ({
          opportunity_id: themeRow.id,
          interview_id: q.interview_id && validInterviewIds.has(q.interview_id) ? q.interview_id : null,
          snapshot_id: null,
          quote: q.quote,
        }))
        .filter((r) => r.quote);
      if (evidenceRows.length > 0) {
        const { error: evError } = await supabase.from("evidence").insert(evidenceRows);
        if (evError) console.error("Failed to insert theme evidence:", evError);
      }

      createdThemes.push({
        id: themeRow.id,
        finding: theme.finding,
        frequency_n: frequencyN,
        frequency_m: frequencyM,
        member_count: memberIds.length,
      });
    }

    return NextResponse.json({ success: true, themes: createdThemes });
  } catch (error) {
    console.error("Themes apply error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
