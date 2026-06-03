import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { z } from "zod";

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
