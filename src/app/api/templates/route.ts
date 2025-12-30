import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// Validation schemas
const generateTemplateSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

const updateTemplateSchema = z.object({
  templateId: z.string().uuid("Invalid template ID"),
  rubric: z.record(z.any()).optional(),
  status: z.enum(["draft", "approved"]).optional(),
  is_active: z.boolean().optional(),
  share_token: z.string().min(8).max(20).optional(),
});

// GET - List templates for a project
export async function GET(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from("templates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Generate a new template using the Planner agent
export async function POST(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limiting - use user ID as identifier for authenticated endpoints
    const identifier = getClientIdentifier(req, user!.id, "templates");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Check env vars first
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY");
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY env var" }, { status: 500 });
    }
    if (!process.env.DATABASE_URL) {
      console.error("Missing DATABASE_URL");
      return NextResponse.json({ error: "Missing DATABASE_URL env var" }, { status: 500 });
    }

    // Validate input
    const body = await req.json();
    const validated = generateTemplateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { projectId } = validated.data;

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    // Get project details for context
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project fetch error:", projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get existing template count for versioning
    const { count } = await supabase
      .from("templates")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const version = (count || 0) + 1;

    // Use the planner agent to generate the rubric
    console.log("Getting planner agent...");
    const planner = mastra.getAgent("plannerAgent");

    const prompt = `Generate an interview rubric for the following research project:

## Project Details
- **Name**: ${project.name}
- **Research Goals**: ${project.research_goals}
- **Target Audience**: ${project.target_audience || "Not specified"}
- **Desired Outcome**: ${project.desired_outcome || "Not specified"}
- **Max Duration**: ${project.settings?.max_duration || 15} minutes
- **Tone**: ${project.settings?.tone || "professional"}

Please create a comprehensive story-based interview rubric that will help us gather deep insights about the research goals. Focus on specific past experiences and behaviors, not opinions or hypotheticals.

Return ONLY the JSON rubric object, no additional text.`;

    const response = await planner.generate(prompt);

    // Parse the rubric from the response
    let rubric;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rubric = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse rubric:", parseError);
      // Return a default structure if parsing fails
      rubric = {
        introduction: response.text.substring(0, 500),
        topics: [],
        closing: "Thank you for your time and insights.",
      };
    }

    // Save the template to the database (using regular client, not service client)
    const { data: template, error: insertError } = await supabase
      .from("templates")
      .insert({
        project_id: projectId,
        name: `Interview Rubric v${version}`,
        version,
        rubric,
        status: "draft",
        is_active: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Generate template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a template (approve, activate, edit rubric)
export async function PATCH(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Validate input
    const body = await req.json();
    const validated = updateTemplateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { templateId, rubric, status, is_active, share_token } = validated.data;

    const supabase = await createClient();

    // Fetch template to verify ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("templates")
      .select("id, project_id")
      .eq("id", templateId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(existingTemplate.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (rubric !== undefined) updates.rubric = rubric;
    if (status !== undefined) {
      updates.status = status;
      if (status === "approved") {
        updates.approved_at = new Date().toISOString();
      }
    }
    if (is_active !== undefined) updates.is_active = is_active;
    if (share_token !== undefined) updates.share_token = share_token;

    // If activating this template, deactivate others in the same project
    if (is_active === true) {
      const { error: deactivateError } = await supabase
        .from("templates")
        .update({ is_active: false })
        .eq("project_id", existingTemplate.project_id)
        .neq("id", templateId);

      if (deactivateError) {
        console.error("Failed to deactivate other templates:", deactivateError);
      }
    }

    const { data: updatedTemplate, error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a template
export async function DELETE(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch template to verify ownership
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("templates")
      .select("id, project_id")
      .eq("id", templateId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Authorization: verify user owns this project
    const { authorized, error: ownershipError } = await verifyProjectOwnership(existingTemplate.project_id, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
