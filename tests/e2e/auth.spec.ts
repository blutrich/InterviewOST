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

test.describe("Auth flow", () => {
  let testUserId: string | undefined;

  test.afterEach(async () => {
    if (testUserId) {
      await deleteTestUser(admin, testUserId);
      testUserId = undefined;
    }
  });

  test("redirects unauthenticated user from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("can log in via email + password and reach the dashboard", async ({ page }) => {
    const email = `e2e-auth-${randomUUID()}@example.com`;
    const password = `E2E!${randomUUID()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    testUserId = data.user!.id;

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /(sign in|log in)/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});
