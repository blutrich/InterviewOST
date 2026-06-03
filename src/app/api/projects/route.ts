import { NextResponse } from "next/server";
import { createClient, createServiceClient, getAuthenticatedUser, verifyBearerToken, verifyProjectOwnership } from "@/lib/supabase/server";
import { z } from "zod";

// GET - List projects with their active template
// Accepts Bearer <SUPABASE_SERVICE_ROLE_KEY> (public for integrations)
export async function GET(req: Request) {
  try {
    if (!verifyBearerToken(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        research_goals,
        target_audience,
        desired_outcome,
        status,
        created_at,
        templates!inner (
          id,
          name,
          share_token,
          rubric
        )
      `)
      .eq("status", "active")
      .eq("templates.is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }

    const result = (projects || []).map((project) => {
      const template = Array.isArray(project.templates)
        ? project.templates[0]
        : project.templates;
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        research_goals: project.research_goals,
        target_audience: project.target_audience,
        desired_outcome: project.desired_outcome,
        status: project.status,
        created_at: project.created_at,
        active_template: template || null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
});

// PATCH - Rename a project (owner or collaborator)
export async function PATCH(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await req.json();
    const validated = updateProjectSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { projectId, name } = validated.data;

    // Authorization: owner or member (RLS-backed)
    const { authorized, error: ownershipError } = await verifyProjectOwnership(projectId, user!.id);
    if (!authorized) {
      return NextResponse.json({ error: ownershipError }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .select("id, name")
      .single();

    if (error) {
      console.error("Failed to rename project:", error);
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
