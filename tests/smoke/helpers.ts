import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { deleteTestUser as removeTestUser } from "../cleanup";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type TestUser = {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
  client: SupabaseClient;
};

export async function createTestUser(prefix: string): Promise<TestUser> {
  const email = `smoketest-${prefix}-${randomUUID()}@example.com`;
  const password = `Smoke!${randomUUID()}`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    throw new Error(`createTestUser failed: ${createErr?.message}`);
  }

  const tmp = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: signInErr } = await tmp.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr || !session.session) {
    throw new Error(`signIn failed: ${signInErr?.message}`);
  }

  // RLS-active client scoped to this user's JWT
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
  });

  return {
    id: created.user.id,
    email,
    password,
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
    client,
  };
}

export async function deleteTestUser(userId: string) {
  await removeTestUser(admin, userId);
}

export async function createProject(
  owner: { id: string; client: SupabaseClient },
  name = "Smoke Project",
): Promise<string> {
  const { data, error } = await owner.client
    .from("projects")
    .insert({
      user_id: owner.id,
      name,
      research_goals: "Test goals",
      target_audience: "Test audience",
      desired_outcome: "Test outcome",
    })
    .select("id")
    .single();
  if (error) throw new Error(`createProject failed: ${error.message}`);
  return data.id as string;
}
