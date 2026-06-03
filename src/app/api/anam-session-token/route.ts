import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Anam session-token endpoint.
 *
 * Mints a short-lived (~1h) Anam session token that the browser uses to
 * initialise the Anam JS SDK. ANAM_API_KEY MUST NEVER reach the browser.
 *
 * The client posts the personaConfig + sessionOptions it wants for this
 * session; we re-validate that it's tied to a real, still-active interview
 * (by access_token) before spending an Anam token.
 *
 * Docs: https://anam.ai/docs/api-reference/sessions/create-session-token
 */

const ANAM_TOKEN_ENDPOINT = "https://api.anam.ai/v1/auth/session-token";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, personaConfig, sessionOptions } = body ?? {};

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Missing interview access token." },
        { status: 400 },
      );
    }
    if (!personaConfig || typeof personaConfig !== "object") {
      return NextResponse.json(
        { error: "Missing personaConfig in request body." },
        { status: 400 },
      );
    }

    const identifier = getClientIdentifier(req, token, "anam-session-token");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const apiKey = process.env.ANAM_API_KEY;
    if (!apiKey) {
      console.error("ANAM_API_KEY missing on server.");
      return NextResponse.json(
        { error: "Avatar service is not configured." },
        { status: 500 },
      );
    }

    const supabase = await createServiceClient();
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, status")
      .eq("access_token", token)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json(
        { error: "Interview not found." },
        { status: 404 },
      );
    }
    if (interview.status === "completed" || interview.status === "abandoned") {
      return NextResponse.json(
        { error: "Interview is no longer active." },
        { status: 403 },
      );
    }

    const upstream = await fetch(ANAM_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personaConfig,
        ...(sessionOptions ?? {}),
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error("[anam] token request failed", upstream.status, text);
      return NextResponse.json(
        { error: `Anam token request failed: ${text || upstream.statusText}` },
        { status: upstream.status },
      );
    }

    let data: { sessionToken?: string };
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Anam response was not valid JSON." },
        { status: 502 },
      );
    }
    if (!data.sessionToken) {
      return NextResponse.json(
        { error: "Anam response missing sessionToken." },
        { status: 502 },
      );
    }

    return NextResponse.json({ sessionToken: data.sessionToken });
  } catch (err) {
    console.error("[anam] /api/anam-session-token threw", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error." },
      { status: 500 },
    );
  }
}
