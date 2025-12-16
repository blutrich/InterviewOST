import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";

// GET - List templates for a project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: templates, error } = await supabase
      .from("templates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    // Check env vars first
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY");
      return NextResponse.json({ error: "Missing OPENROUTER_API_KEY env var" }, { status: 500 });
    }
    if (!process.env.DATABASE_URL) {
      console.error("Missing DATABASE_URL");
      return NextResponse.json({ error: "Missing DATABASE_URL env var" }, { status: 500 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
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

    // Save the template to the database
    const serviceClient = await createServiceClient();
    const { data: template, error: insertError } = await serviceClient
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
      return NextResponse.json({ error: insertError.message }, { status: 500 });
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
    const { templateId, rubric, status, is_active } = await req.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const supabase = await createClient();

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

    // If activating this template, deactivate others in the same project
    if (is_active === true) {
      const { data: template } = await supabase
        .from("templates")
        .select("project_id")
        .eq("id", templateId)
        .single();

      if (template) {
        await supabase
          .from("templates")
          .update({ is_active: false })
          .eq("project_id", template.project_id)
          .neq("id", templateId);
      }
    }

    const { data: updatedTemplate, error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
