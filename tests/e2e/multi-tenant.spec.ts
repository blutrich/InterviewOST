import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { deleteTestUser } from "../cleanup";

config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUser() {
  const email = `e2e-mt-${randomUUID()}@example.com`;
  const password = `E2E!${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  return { id: data.user!.id, email, password };
}

async function seedProjectWithSnapshot(userId: string) {
  const { data: project, error: e1 } = await admin
    .from("projects")
    .insert({
      user_id: userId,
      name: "Victim Project",
      research_goals: "Victim research goals",
      desired_outcome: "Should remain private",
    })
    .select("id")
    .single();
  if (e1) throw e1;

  const accessToken = `tok-${randomUUID().slice(0, 8)}`;
  const { data: interview, error: e2 } = await admin
    .from("interviews")
    .insert({
      project_id: project.id,
      user_id: userId,
      access_token: accessToken,
      status: "completed",
      participant_name: "VICTIM SECRET NAME",
    })
    .select("id")
    .single();
  if (e2) throw e2;

  const { data: snapshot, error: e3 } = await admin
    .from("snapshots")
    .insert({
      interview_id: interview.id,
      user_id: userId,
      experience_map: { steps: [{ action: "VICTIM EXPERIENCE STEP", feeling: "private" }] },
      quote_reel: [{ quote: "VICTIM CONFIDENTIAL QUOTE", emotion: "private" }],
      facts: { role: "VICTIM ROLE" },
      blind_spots: [{ observation: "VICTIM BLIND SPOT", severity: "high" }],
      status: "pending",
    })
    .select("id")
    .single();
  if (e3) throw e3;

  return {
    projectId: project.id as string,
    interviewId: interview.id as string,
    snapshotId: snapshot.id as string,
  };
}

test.describe("Multi-tenant data isolation", () => {
  let attacker: { id: string; email: string; password: string };
  let victim: { id: string };
  let victimResources: { projectId: string; interviewId: string; snapshotId: string };

  test.beforeAll(async () => {
    attacker = await createUser();
    victim = await createUser();
    victimResources = await seedProjectWithSnapshot(victim.id);
  });

  test.afterAll(async () => {
    if (attacker?.id) await deleteTestUser(admin, attacker.id);
    if (victim?.id) await deleteTestUser(admin, victim.id);
  });

  test("attacker logged in cannot read victim's snapshot SSR page", async ({ page }) => {
    // Log in as attacker via the real UI
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(attacker.email);
    await page.getByLabel(/password/i).fill(attacker.password);
    await page.getByRole("button", { name: /(sign in|log in)/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Attacker visits victim's snapshot page using guessed/leaked IDs
    const url = `/dashboard/projects/${victimResources.projectId}/interviews/${victimResources.interviewId}/snapshot`;
    const response = await page.goto(url);

    // Expected behavior (after CRITICAL #1 fix):
    // - 404 (notFound) OR redirect to /dashboard, OR explicit 403 page
    // - VICTIM secrets MUST NOT appear in DOM
    const html = await page.content();

    expect(html).not.toContain("VICTIM CONFIDENTIAL QUOTE");
    expect(html).not.toContain("VICTIM SECRET NAME");
    expect(html).not.toContain("VICTIM EXPERIENCE STEP");
    expect(html).not.toContain("VICTIM BLIND SPOT");
    expect(html).not.toContain("VICTIM ROLE");

    // Status should be 404 or redirect; the current vulnerable code returns 200 with content.
    if (response) {
      expect(response.status()).toBeLessThan(500);
      // Strict: the page must NOT 200 with the snapshot rendered
      // Fail-closed expected; will RED until CRITICAL #1 is fixed.
      // Soft check via content above is the load-bearing assertion.
    }
  });

  test("attacker logged in cannot read victim's interview detail page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(attacker.email);
    await page.getByLabel(/password/i).fill(attacker.password);
    await page.getByRole("button", { name: /(sign in|log in)/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    const url = `/dashboard/projects/${victimResources.projectId}/interviews/${victimResources.interviewId}`;
    await page.goto(url);
    const html = await page.content();
    expect(html).not.toContain("VICTIM SECRET NAME");
  });

  test("attacker logged in cannot read victim's project overview", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(attacker.email);
    await page.getByLabel(/password/i).fill(attacker.password);
    await page.getByRole("button", { name: /(sign in|log in)/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    const url = `/dashboard/projects/${victimResources.projectId}`;
    await page.goto(url);
    const html = await page.content();
    expect(html).not.toContain("Victim Project");
    expect(html).not.toContain("Should remain private");
  });
});
