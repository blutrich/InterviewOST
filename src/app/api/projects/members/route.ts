import { NextResponse } from "next/server";
import { createClient, getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";
import { z } from "zod";

const addSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

async function isOwner(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  const { data, error } = await supabase.rpc("is_project_owner", { pid: projectId });
  return !error && data === true;
}

// GET ?projectId= : list owner + members (any member can view)
export async function GET(req: Request) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError) return authError;

  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

  const { authorized, error: accErr } = await verifyProjectOwnership(projectId, user!.id);
  if (!authorized) return NextResponse.json({ error: accErr }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_project_members", { pid: projectId });
  if (error) {
    console.error("get_project_members failed:", error);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
  return NextResponse.json({ members: data ?? [] });
}

// POST { projectId, email, role? } : invite an existing account (owner only)
export async function POST(req: Request) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError) return authError;

  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { projectId, email, role } = parsed.data;

  const supabase = await createClient();
  if (!(await isOwner(supabase, projectId))) {
    return NextResponse.json({ error: "Only the project owner can manage members" }, { status: 403 });
  }

  // Resolve the invitee's account by email.
  const { data: inviteeId, error: lookupErr } = await supabase.rpc("get_user_id_by_email", { p_email: email });
  if (lookupErr) {
    console.error("get_user_id_by_email failed:", lookupErr);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!inviteeId) {
    return NextResponse.json(
      { error: "No Base44 account uses that email. They need to sign up first." },
      { status: 404 }
    );
  }
  if (inviteeId === user!.id) {
    return NextResponse.json({ error: "You already own this project" }, { status: 409 });
  }

  // RLS ("Owners manage membership") also enforces owner-only at the DB layer.
  const { error: insErr } = await supabase
    .from("project_members")
    .upsert({ project_id: projectId, user_id: inviteeId, role }, { onConflict: "project_id,user_id" });
  if (insErr) {
    console.error("add member failed:", insErr);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE ?projectId=&userId= : remove a member (owner only)
export async function DELETE(req: Request) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError) return authError;

  const params = new URL(req.url).searchParams;
  const projectId = params.get("projectId");
  const userId = params.get("userId");
  if (!projectId || !userId) {
    return NextResponse.json({ error: "projectId and userId required" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!(await isOwner(supabase, projectId))) {
    return NextResponse.json({ error: "Only the project owner can manage members" }, { status: 403 });
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) {
    console.error("remove member failed:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
