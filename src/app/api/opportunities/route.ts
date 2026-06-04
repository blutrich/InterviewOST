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
const generateOpportunitiesSchema = z.object({
  snapshotId: z.string().uuid("Invalid snapshot ID"),
  projectId: z.string().uuid("Invalid project ID"),
});

const createUpdateOpportunitySchema = z.object({
  id: z.string().uuid("Invalid opportunity ID").optional(),
  projectId: z.string().uuid("Invalid project ID"),
  parentId: z.string().uuid("Invalid parent ID").nullable().optional(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  type: z.enum(["theme", "opportunity", "pain_point", "unmet_need", "workaround", "outcome", "solution"]).optional(),
  status: z.enum(["suggested", "approved", "rejected", "archived", "merged"]).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

const addEvidenceSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID"),
  snapshotId: z.string().uuid("Invalid snapshot ID").optional(),
  interviewId: z.string().uuid("Invalid interview ID").optional(),
  quote: z.string().min(1, "Quote is required").max(2000, "Quote too long"),
  context: z.string().max(1000, "Context too long").optional(),
});

// Schema for opportunity suggestions from mapper agent
const opportunitySuggestionsSchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum(["opportunity", "pain_point", "unmet_need", "workaround"]),
      evidence_quote: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
    })
  ),
  parent_suggestions: z.array(
    z.object({
      opportunity_title: z.string(),
      suggested_parent_title: z.string().nullable(),
      reasoning: z.string(),
      alternative_parents: z.array(z.string()).optional(),
    })
  ),
  potential_duplicates: z.array(
    z.object({
      new_opportunity: z.string(),
      potential_duplicate: z.string(),
      similarity_score: z.enum(["high", "medium", "low"]),
      recommendation: z.enum(["merge", "keep_separate", "review"]),
      reasoning: z.string(),
    })
  ),
});

// POST: Generate opportunity suggestions from a snapshot
export async function POST(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limiting - use user ID as identifier for authenticated endpoints
    const identifier = getClientIdentifier(req, user!.id, "opportunities");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Validate input
    const body = await req.json();
    const validated = generateOpportunitiesSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { snapshotId, projectId } = validated.data;

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch snapshot with interview data
    const { data: snapshot, error: snapshotError } = await supabase
      .from("snapshots")
      .select("*, interviews(*)")
      .eq("id", snapshotId)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    if (snapshot.status !== "approved") {
      return NextResponse.json({ error: "Snapshot must be approved before mapping" }, { status: 400 });
    }

    // Fetch existing opportunities for deduplication
    const { data: existingOpportunities } = await supabase
      .from("opportunities")
      .select("*")
      .eq("project_id", projectId);

    // Fetch project for root outcome
    const { data: project } = await supabase
      .from("projects")
      .select("desired_outcome")
      .eq("id", projectId)
      .single();

    // Get the mapper agent
    const mapper = mastra.getAgent("mapperAgent");

    // Build context for the mapper
    const snapshotContext = `
## Interview Snapshot Data

### Experience Map
${JSON.stringify(snapshot.experience_map, null, 2)}

### Quote Reel
${JSON.stringify(snapshot.quote_reel, null, 2)}

### Facts
${JSON.stringify(snapshot.facts, null, 2)}

### Participant
${snapshot.interviews?.participant_name || "Anonymous"}
`;

    const existingContext =
      existingOpportunities && existingOpportunities.length > 0
        ? `
## Existing Opportunities in Tree
${existingOpportunities
  .map(
    (o: { id: string; title: string; description: string; type: string }) =>
      `- ${o.title} (${o.type}): ${o.description || "No description"}`
  )
  .join("\n")}
`
        : `
## Existing Opportunities
No existing opportunities yet. This is a new tree.
`;

    const rootContext = project?.desired_outcome
      ? `
## Root Outcome (OST Root)
${project.desired_outcome}
`
      : "";

    const prompt = `Analyze this Interview Snapshot and suggest opportunities for the Opportunity Solution Tree:

${snapshotContext}

${rootContext}

${existingContext}

---

Based on this snapshot, extract opportunities and suggest where they should go in the tree.

IMPORTANT: Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "opportunities": [
    {
      "title": "Short title",
      "description": "Description of the opportunity",
      "type": "opportunity" | "pain_point" | "unmet_need" | "workaround",
      "evidence_quote": "Direct quote from interview",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "parent_suggestions": [
    {
      "opportunity_title": "Title of the opportunity",
      "suggested_parent_title": null or "Existing opportunity title",
      "reasoning": "Why this relationship"
    }
  ],
  "potential_duplicates": []
}`;

    const response = await mapper.generate(prompt);

    // Parse the JSON response manually
    let suggestions;
    try {
      const text = response.text;
      // Remove any markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      const jsonStr = jsonMatch[1] || text;
      const parsed = JSON.parse(jsonStr.trim());
      suggestions = opportunitySuggestionsSchema.parse(parsed);
    } catch (parseError) {
      console.error("Failed to parse mapper response:", parseError);
      console.error("Raw response:", response.text);
      return NextResponse.json({ error: "Failed to parse opportunity suggestions" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      suggestions,
      snapshotId,
      projectId,
    });
  } catch (error) {
    console.error("Opportunities API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Fetch opportunities for a project
export async function GET(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();

    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select("*, evidence(*)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch opportunities:", error);
      return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
    }

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Opportunities fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Create or update an opportunity
export async function PUT(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Validate input
    const body = await req.json();
    const validated = createUpdateOpportunitySchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { id, projectId, parentId, title, description, type, status, position } = validated.data;

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();

    const opportunityData = {
      project_id: projectId,
      parent_id: parentId || null,
      title,
      description,
      type: type || "opportunity",
      status: status || "suggested",
      position: position || { x: 0, y: 0 },
    };

    let result;

    if (id) {
      // Update existing
      const { data, error } = await supabase
        .from("opportunities")
        .update(opportunityData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 });
      }
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from("opportunities")
        .insert(opportunityData)
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      opportunity: result,
    });
  } catch (error) {
    console.error("Opportunity save error:", error);
    return NextResponse.json({ error: "Failed to save opportunity" }, { status: 500 });
  }
}

// DELETE: Remove an opportunity
export async function DELETE(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Opportunity ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch opportunity to get project_id for authorization
    const { data: existingOpportunity, error: fetchError } = await supabase
      .from("opportunities")
      .select("id, project_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingOpportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(existingOpportunity.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { error } = await supabase.from("opportunities").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete opportunity:", error);
      return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Opportunity delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Add evidence to an opportunity
export async function PATCH(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Validate input
    const body = await req.json();
    const validated = addEvidenceSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { opportunityId, snapshotId, interviewId, quote, context } = validated.data;

    const supabase = await createClient();

    // Fetch opportunity to get project_id for authorization
    const { data: existingOpportunity, error: fetchError } = await supabase
      .from("opportunities")
      .select("id, project_id")
      .eq("id", opportunityId)
      .single();

    if (fetchError || !existingOpportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(existingOpportunity.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { data: evidence, error } = await supabase
      .from("evidence")
      .insert({
        opportunity_id: opportunityId,
        snapshot_id: snapshotId,
        interview_id: interviewId,
        quote,
        context,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add evidence:", error);
      return NextResponse.json({ error: "Failed to add evidence" }, { status: 500 });
    }

    // Update evidence count on opportunity
    const { error: rpcError } = await supabase.rpc("increment_evidence_count", {
      opportunity_id: opportunityId,
    });

    if (rpcError) {
      console.error("Failed to update evidence count:", rpcError);
    }

    return NextResponse.json({
      success: true,
      evidence,
    });
  } catch (error) {
    console.error("Evidence add error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
