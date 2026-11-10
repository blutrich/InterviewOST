import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestUser, deleteTestUser, createProject, type TestUser } from "./helpers";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";

// Build the SSR cookie used by @supabase/ssr in middleware/server.ts.
// Cookie naming: sb-<ref>-auth-token; value is base64-encoded JSON session.
// Note: @supabase/ssr stores chunked cookies for large payloads; for tests we use the
// single-cookie form (works for tokens under ~3.5KB which is the default JWT case).
function authCookieHeader(accessToken: string, refreshToken: string): string {
  const ref = process.env
    .NEXT_PUBLIC_SUPABASE_URL!.replace(/^https?:\/\//, "")
    .split(".")[0];
  const cookieName = `sb-${ref}-auth-token`;
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: null,
  };
  const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64");
  return `${cookieName}=${encodeURIComponent(value)}`;
}

async function api(path: string, opts: RequestInit & { user?: TestUser } = {}) {
  const headers = new Headers(opts.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (opts.user) headers.set("Cookie", authCookieHeader(opts.user.accessToken, opts.user.refreshToken));
  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

describe("API multi-tenant isolation", () => {
  let userA: TestUser;
  let userB: TestUser;
  let projectAId: string;

  beforeAll(async () => {
    userA = await createTestUser("api-a");
    userB = await createTestUser("api-b");
    projectAId = await createProject(userA, "User A's Project");
  }, 60000);

  afterAll(async () => {
    if (userA?.id) await deleteTestUser(userA.id);
    if (userB?.id) await deleteTestUser(userB.id);
  }, 60000);

  it("unauthenticated GET /api/interviews returns 401", async () => {
    const res = await api(`/api/interviews?projectId=${projectAId}`);
    expect(res.status).toBe(401);
  });

  it("User B cannot list User A's interviews → 403", async () => {
    const res = await api(`/api/interviews?projectId=${projectAId}`, { user: userB });
    expect([403, 404]).toContain(res.status);
  });

  it("User B cannot create an interview in User A's project → 403", async () => {
    const res = await api("/api/interviews", {
      method: "POST",
      user: userB,
      body: JSON.stringify({ projectId: projectAId }),
    });
    expect([403, 404]).toContain(res.status);
  });

  it("User A can list interviews in User A's project (positive control)", async () => {
    const res = await api(`/api/interviews?projectId=${projectAId}`, { user: userA });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("missing projectId returns 400", async () => {
    const res = await api(`/api/interviews`, { user: userA });
    expect(res.status).toBe(400);
  });
});
