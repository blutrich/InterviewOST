import { test, expect, type APIResponse } from "@playwright/test";
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

const PARTICIPANT_ANSWERS = [
  "I'm a product manager at a small e-commerce company. Last Tuesday I tried to buy running shoes online for myself.",
  "At the payment step the site forced me to create an account. I got annoyed, closed the tab, and bought the same shoes on Amazon in about a minute.",
  "Honestly I just don't want another password to remember. I felt frustrated because I had already typed my address and card details.",
];

async function json(response: APIResponse) {
  const text = await response.text();
  expect(response.ok(), `${response.url()} -> ${response.status()} ${text.slice(0, 300)}`).toBeTruthy();
  return JSON.parse(text);
}

// Full product flow with real agent calls:
// project -> template (planner) -> interview link -> participant chat (interviewer)
// -> mark complete -> snapshot (synthesizer) -> opportunities (mapper) -> OST page.
test.describe("Core flow", () => {
  test.setTimeout(6 * 60 * 1000);

  let researcher: { id: string; email: string; password: string };

  test.beforeAll(async () => {
    const email = `e2e-flow-${randomUUID()}@example.com`;
    const password = `E2E!${randomUUID()}`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(error.message);
    researcher = { id: data.user!.id, email, password };
  });

  test.afterAll(async () => {
    if (researcher?.id) await deleteTestUser(admin, researcher.id);
  });

  test("researcher runs an interview end to end and sees it on the OST", async ({ page, browser }) => {
    // --- Researcher signs in through the real UI
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(researcher.email);
    await page.getByLabel(/password/i).fill(researcher.password);
    await page.getByRole("button", { name: /(sign in|log in)/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // --- Project (seeded; the new-project form is covered by the UI itself)
    const outcome = `Shoppers complete checkout faster ${randomUUID().slice(0, 6)}`;
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        user_id: researcher.id,
        name: "E2E Checkout Research",
        research_goals: "Understand why shoppers abandon checkout",
        target_audience: "Online shoppers",
        desired_outcome: outcome,
      })
      .select("id")
      .single();
    if (projectError) throw projectError;
    const projectId = project.id as string;

    // --- Planner agent generates the rubric; researcher approves + activates it
    const generated = await json(await page.request.post("/api/templates", { data: { projectId } }));
    const template = generated.template ?? generated;
    expect(template.rubric.topics.length).toBeGreaterThan(0);
    expect(template.rubric.topics[0].questions.length).toBeGreaterThan(0);

    await json(
      await page.request.patch("/api/templates", {
        data: { templateId: template.id, status: "approved", is_active: true },
      })
    );

    // --- Interview link
    const interview = await json(
      await page.request.post("/api/interviews", { data: { projectId, templateId: template.id } })
    );
    expect(interview.access_token).toBeTruthy();

    // --- Participant (separate, signed-out browser) takes the interview
    const participantContext = await browser.newContext();
    const participant = await participantContext.newPage();
    await participant.goto(`/i/${interview.access_token}`);
    await participant.getByPlaceholder("Enter your name").fill("Dana");
    await participant.getByRole("button", { name: /start interview/i }).click();

    const input = participant.getByPlaceholder("Type your response...");
    const bubbles = participant.locator("p.whitespace-pre-wrap");

    // Opening from the interviewer agent, streamed in
    await expect(bubbles).toHaveCount(1, { timeout: 60000 });
    await expect(input).toBeEnabled({ timeout: 60000 });
    expect((await bubbles.first().innerText()).length).toBeGreaterThan(20);

    for (let i = 0; i < PARTICIPANT_ANSWERS.length; i++) {
      await input.fill(PARTICIPANT_ANSWERS[i]);
      await participant.getByRole("button", { name: /send/i }).click();
      // 1 opening + (answer + reply) per completed turn
      await expect(bubbles).toHaveCount(1 + 2 * (i + 1), { timeout: 60000 });
      await expect(input).toBeEnabled({ timeout: 60000 });
    }

    const transcript = (await bubbles.allInnerTexts()).join("\n");
    expect(transcript).not.toContain("[INTERVIEW_COMPLETE]");
    expect(transcript).not.toMatch(/\[(Internal|Mental note|Thinking)/i);
    await participantContext.close();

    // --- Transcript is stored: opening + 3 answers + 3 replies
    const { data: stored } = await admin
      .from("messages")
      .select("role")
      .eq("interview_id", interview.id)
      .order("created_at", { ascending: true });
    expect(stored?.map((m) => m.role)).toEqual([
      "assistant",
      "user",
      "assistant",
      "user",
      "assistant",
      "user",
      "assistant",
    ]);

    // --- Researcher marks it complete; the snapshot is built in the background
    await json(
      await page.request.patch("/api/interviews", { data: { interviewId: interview.id, status: "completed" } })
    );
    let snapshot: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    await expect
      .poll(
        async () => {
          const res = await page.request.get(`/api/synthesis?interviewId=${interview.id}`);
          if (res.ok()) snapshot = await res.json();
          return res.status();
        },
        { timeout: 120_000, intervals: [3000] }
      )
      .toBe(200);
    expect(snapshot.status).toBe("pending");
    // A manual request now loses to the automatic one instead of duplicating it.
    const duplicate = await page.request.post("/api/synthesis", { data: { interviewId: interview.id } });
    expect(duplicate.status()).toBe(409);
    expect(snapshot.experience_map.length).toBeGreaterThan(0);
    expect(snapshot.quote_reel.length).toBeGreaterThan(0);

    await page.goto(`/dashboard/projects/${projectId}/interviews/${interview.id}/snapshot`);
    await expect(page.getByText(snapshot.quote_reel[0].quote.slice(0, 40), { exact: false }).first()).toBeVisible({
      timeout: 15000,
    });

    // --- Human validation: mapping is refused until the snapshot is approved
    const premature = await page.request.post("/api/opportunities", { data: { snapshotId: snapshot.id, projectId } });
    expect(premature.status()).toBe(400);
    await json(
      await page.request.patch("/api/synthesis", { data: { snapshotId: snapshot.id, status: "approved" } })
    );

    // --- Mapper suggests opportunities; researcher adds one to the tree
    const { suggestions } = await json(
      await page.request.post("/api/opportunities", { data: { snapshotId: snapshot.id, projectId } })
    );
    expect(suggestions.opportunities.length).toBeGreaterThan(0);
    const suggested = suggestions.opportunities[0];

    await json(
      await page.request.put("/api/opportunities", {
        data: {
          projectId,
          title: suggested.title.slice(0, 200),
          description: suggested.description.slice(0, 2000),
          type: suggested.type,
          status: "approved",
          position: { x: 200, y: 300 },
        },
      })
    );

    // --- OST page shows the root outcome and the new opportunity
    await page.goto(`/dashboard/projects/${projectId}/tree`);
    await expect(page.getByText(outcome, { exact: false }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(suggested.title.slice(0, 30), { exact: false }).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
