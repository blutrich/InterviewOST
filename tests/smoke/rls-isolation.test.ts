import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  admin,
  createTestUser,
  deleteTestUser,
  createProject,
  type TestUser,
} from "./helpers";

describe("RLS multi-tenant isolation", () => {
  let userA: TestUser;
  let userB: TestUser;
  let projectAId: string;
  let interviewAId: string;
  let pendingInterviewAId: string;

  beforeAll(async () => {
    userA = await createTestUser("rls-a");
    userB = await createTestUser("rls-b");
    projectAId = await createProject(userA, "User A's Project");

    const { data: completed, error: e1 } = await admin
      .from("interviews")
      .insert({
        project_id: projectAId,
        user_id: userA.id,
        access_token: `tok-${Math.random().toString(36).slice(2, 10)}`,
        status: "completed",
      })
      .select("id")
      .single();
    if (e1) throw e1;
    interviewAId = completed.id;

    const { data: pending, error: e2 } = await admin
      .from("interviews")
      .insert({
        project_id: projectAId,
        user_id: userA.id,
        access_token: `tok-${Math.random().toString(36).slice(2, 10)}`,
        status: "pending",
      })
      .select("id")
      .single();
    if (e2) throw e2;
    pendingInterviewAId = pending.id;
  }, 60000);

  afterAll(async () => {
    if (userA?.id) await deleteTestUser(userA.id);
    if (userB?.id) await deleteTestUser(userB.id);
  }, 60000);

  it("User B cannot SELECT User A's project via direct Supabase client", async () => {
    const { data, error } = await userB.client
      .from("projects")
      .select("id, name")
      .eq("id", projectAId);
    // RLS filters out — no rows, no error
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("User B cannot SELECT User A's COMPLETED interview", async () => {
    const { data, error } = await userB.client
      .from("interviews")
      .select("id")
      .eq("id", interviewAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  // Regression guard: the old `Public interview access by token` policy let anyone
  // list every pending/active interview. Dropped in migration 010; the participant
  // page now goes through /api/interviews/session with the service-role client.
  it(
    "User B cannot SELECT User A's PENDING interview (public-read RLS leak closed)",
    async () => {
      const { data, error } = await userB.client
        .from("interviews")
        .select("id, project_id, user_id, access_token")
        .eq("id", pendingInterviewAId);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    },
  );

  it("User B cannot UPDATE User A's interview", async () => {
    const { data, error } = await userB.client
      .from("interviews")
      .update({ participant_name: "PWNED" })
      .eq("id", interviewAId)
      .select("id");
    // RLS makes the update affect 0 rows; should NOT throw
    expect(error).toBeNull();
    expect(data).toEqual([]);

    // Verify via service role that the row is unchanged
    const { data: row } = await admin
      .from("interviews")
      .select("participant_name")
      .eq("id", interviewAId)
      .single();
    expect(row?.participant_name).not.toBe("PWNED");
  });

  it("User B cannot DELETE User A's interview", async () => {
    const { data, error } = await userB.client
      .from("interviews")
      .delete()
      .eq("id", interviewAId)
      .select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);

    const { data: row } = await admin
      .from("interviews")
      .select("id")
      .eq("id", interviewAId)
      .single();
    expect(row?.id).toBe(interviewAId);
  });

  it("User B cannot INSERT a project pointing at User A's user_id (WITH CHECK enforced)", async () => {
    const { error } = await userB.client
      .from("projects")
      .insert({ user_id: userA.id, name: "B-spoof", desired_outcome: "X" });
    // RLS WITH CHECK should reject this. Either 42501 (RLS violation) or returns no row.
    expect(error).not.toBeNull();
    expect(error?.code).toMatch(/42501|PGRST/);
  });

  it("User A can read User A's own project (sanity check)", async () => {
    const { data, error } = await userA.client
      .from("projects")
      .select("id")
      .eq("id", projectAId)
      .single();
    expect(error).toBeNull();
    expect(data?.id).toBe(projectAId);
  });

  it("User B can create their own project (positive control)", async () => {
    const projectBId = await createProject(userB, "User B's Project");
    expect(projectBId).toBeTruthy();
    const { data } = await userB.client
      .from("projects")
      .select("id, user_id")
      .eq("id", projectBId)
      .single();
    expect(data?.user_id).toBe(userB.id);
  });
});
