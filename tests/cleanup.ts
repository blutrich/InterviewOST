import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Remove a test user and everything they own.
 *
 * Foreign keys from public tables to auth.users are NO ACTION, so deleting the
 * auth user alone always fails. Deleting the user's projects cascades to
 * templates, interviews, messages, snapshots, opportunities and evidence; the
 * profile row (created by the signup trigger) has to go before the auth user.
 *
 * Throws on failure so a leaked test user is visible instead of silent.
 */
export async function deleteTestUser(admin: SupabaseClient, userId: string): Promise<void> {
  const { error: projectsError } = await admin.from("projects").delete().eq("user_id", userId);
  if (projectsError) throw new Error(`deleteTestUser: projects: ${projectsError.message}`);

  const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
  if (profileError) throw new Error(`deleteTestUser: profile: ${profileError.message}`);

  const { error: userError } = await admin.auth.admin.deleteUser(userId);
  if (userError) throw new Error(`deleteTestUser: auth user: ${userError.message}`);
}
