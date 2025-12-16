import { createServiceClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { z } from "zod";

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
    const { snapshotId, projectId } = await req.json();

    if (!snapshotId || !projectId) {
      return new Response("Snapshot ID and Project ID are required", {
        status: 400,
      });
    }

    const supabase = await createServiceClient();

    // Fetch snapshot with interview data
    const { data: snapshot, error: snapshotError } = await supabase
      .from("snapshots")
      .select("*, interviews(*)")
      .eq("id", snapshotId)
      .single();

    if (snapshotError || !snapshot) {
      return new Response("Snapshot not found", { status: 404 });
    }

    if (snapshot.status !== "approved") {
      return new Response("Snapshot must be approved before mapping", {
        status: 400,
      });
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
      return new Response("Failed to parse opportunity suggestions", { status: 500 });
    }

    return Response.json({
      success: true,
      suggestions,
      snapshotId,
      projectId,
    });
  } catch (error) {
    console.error("Opportunities API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// GET: Fetch opportunities for a project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new Response("Project ID is required", { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: opportunities, error } = await supabase
      .from("opportunities")
      .select("*, evidence(*)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch opportunities:", error);
      return new Response("Failed to fetch opportunities", { status: 500 });
    }

    return Response.json(opportunities);
  } catch (error) {
    console.error("Opportunities fetch error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// PUT: Create or update an opportunity
export async function PUT(req: Request) {
  try {
    const {
      id,
      projectId,
      parentId,
      title,
      description,
      type,
      status,
      position,
    } = await req.json();

    if (!projectId || !title) {
      return new Response("Project ID and title are required", { status: 400 });
    }

    const supabase = await createServiceClient();

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

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from("opportunities")
        .insert(opportunityData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return Response.json({
      success: true,
      opportunity: result,
    });
  } catch (error) {
    console.error("Opportunity save error:", error);
    return new Response("Failed to save opportunity", { status: 500 });
  }
}

// DELETE: Remove an opportunity
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response("Opportunity ID is required", { status: 400 });
    }

    const supabase = await createServiceClient();

    const { error } = await supabase.from("opportunities").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete opportunity:", error);
      return new Response("Failed to delete opportunity", { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Opportunity delete error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// PATCH: Add evidence to an opportunity
export async function PATCH(req: Request) {
  try {
    const { opportunityId, snapshotId, interviewId, quote, context } =
      await req.json();

    if (!opportunityId || !quote) {
      return new Response("Opportunity ID and quote are required", {
        status: 400,
      });
    }

    const supabase = await createServiceClient();

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
      return new Response("Failed to add evidence", { status: 500 });
    }

    // Update evidence count on opportunity
    await supabase.rpc("increment_evidence_count", {
      opportunity_id: opportunityId,
    });

    return Response.json({
      success: true,
      evidence,
    });
  } catch (error) {
    console.error("Evidence add error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
