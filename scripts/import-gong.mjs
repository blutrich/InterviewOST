#!/usr/bin/env node
/**
 * Gong → Discovery Co-Pilot import (proof-of-concept)
 * -------------------------------------------------------------
 * Pulls a call transcript from the Gong API and inserts it into Supabase
 * as a COMPLETED interview + messages, so the existing synthesis →
 * opportunity-mapping pipeline can run on real sales calls.
 *
 * Speaker role mapping (so synthesis treats the right person as the "participant"):
 *   External party  -> role "user"      (the customer — whose story we mine)
 *   Internal party  -> role "assistant" (your rep — the "interviewer")
 *
 * Usage:
 *   node scripts/import-gong.mjs projects                 # list projects (pick a target id)
 *   node scripts/import-gong.mjs calls [days]             # list recent Gong calls (default 30 days)
 *   node scripts/import-gong.mjs import <callId> <projectId>
 *
 * After import, open the interview in the app:
 *   Generate Snapshot -> approve -> Generate Opportunities
 *
 * Requires in .env.local:
 *   GONG_BASE_URL, GONG_ACCESS_KEY, GONG_ACCESS_KEY_SECRET
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- env ----------
function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch {
    /* no .env.local — rely on process.env */
  }
}
loadEnv();

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`✗ Missing env var: ${name} (add it to .env.local)`);
    process.exit(1);
  }
  return v;
}

// ---------- Gong API ----------
function gongAuthHeader() {
  const key = need("GONG_ACCESS_KEY");
  const secret = need("GONG_ACCESS_KEY_SECRET");
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

async function gong(path, { method = "GET", body } = {}) {
  const base = (process.env.GONG_BASE_URL || "https://api.gong.io").replace(/\/$/, "");
  const res = await fetch(base + path, {
    method,
    headers: {
      Authorization: gongAuthHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Gong ${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

// ---------- Supabase ----------
function supa() {
  return createClient(
    need("NEXT_PUBLIC_SUPABASE_URL"),
    need("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

// ---------- commands ----------
async function listProjects() {
  const { data, error } = await supa()
    .from("projects")
    .select("id, name, user_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data.length) return console.log("No projects found. Create one in the app first.");
  console.log("\nProjects:\n");
  for (const p of data) {
    console.log(`  ${p.id}  ${p.name || "(untitled)"}`);
  }
  console.log(`\nUse a project id as <projectId> in the import command.\n`);
}

async function listCalls(days = 30) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    fromDateTime: from.toISOString(),
    toDateTime: to.toISOString(),
  });
  const data = await gong(`/v2/calls?${params.toString()}`);
  const calls = data.calls || [];
  if (!calls.length) return console.log(`No Gong calls in the last ${days} days.`);
  console.log(`\nRecent Gong calls (last ${days} days):\n`);
  for (const c of calls) {
    const when = (c.started || "").slice(0, 16).replace("T", " ");
    const mins = c.duration ? `${Math.round(c.duration / 60)}m` : "?";
    console.log(`  ${c.id}  ${when}  ${mins.padStart(4)}  ${c.title || "(no title)"}`);
  }
  console.log(`\nUse a call id as <callId> in the import command.\n`);
}

async function getParties(callId) {
  const data = await gong("/v2/calls/extensive", {
    method: "POST",
    body: {
      filter: { callIds: [callId] },
      contentSelector: { exposedFields: { parties: true } },
    },
  });
  const call = (data.calls || [])[0] || {};
  const parties = call.parties || [];
  const map = new Map(); // speakerId -> { name, affiliation }
  for (const p of parties) {
    if (p.speakerId) map.set(p.speakerId, { name: p.name || "Unknown", affiliation: p.affiliation || "Unknown" });
  }
  return { meta: call.metaData || {}, partyMap: map, parties };
}

async function getTranscript(callId) {
  const data = await gong("/v2/calls/transcript", {
    method: "POST",
    body: { filter: { callIds: [callId] } },
  });
  const entry = (data.callTranscripts || [])[0];
  return entry ? entry.transcript || [] : [];
}

async function fetchCall(callId, outPath) {
  if (!callId) {
    console.error("Usage: node scripts/import-gong.mjs fetch <callId> [outPath]");
    process.exit(1);
  }
  console.error(`Fetching call ${callId} from Gong…`);
  const [{ meta, partyMap }, transcript] = await Promise.all([
    getParties(callId),
    getTranscript(callId),
  ]);
  if (!transcript.length) {
    console.error("✗ Gong returned no transcript (not processed yet, or no access).");
    process.exit(1);
  }
  const callStartMs = meta.started ? new Date(meta.started).getTime() : Date.now() - 3600_000;
  const rows = [];
  for (const mono of transcript) {
    const party = partyMap.get(mono.speakerId) || { name: "Unknown", affiliation: "Unknown" };
    const role = party.affiliation === "Internal" ? "assistant" : "user";
    const text = (mono.sentences || []).map((s) => s.text).join(" ").trim();
    if (!text) continue;
    const startMs = (mono.sentences || [])[0]?.start ?? 0;
    rows.push({ role, content: text, offsetMs: startMs, speaker: party.name });
  }
  rows.sort((a, b) => a.offsetMs - b.offsetMs);
  const externalNames = [...partyMap.values()].filter((p) => p.affiliation === "External").map((p) => p.name);
  const messages = rows.map((r, i) => ({
    role: r.role,
    content: r.content,
    created_at: new Date(callStartMs + i * 1000).toISOString(),
  }));
  const out = {
    callId,
    title: meta.title || null,
    started: meta.started || null,
    participantName: externalNames[0] || "Gong Import",
    parties: [...partyMap.entries()].map(([speakerId, p]) => ({ speakerId, ...p })),
    counts: { total: messages.length, participant: messages.filter((m) => m.role === "user").length, rep: messages.filter((m) => m.role === "assistant").length },
    messages,
  };
  const dest = outPath || `/tmp/gong-${callId}.json`;
  const fs = await import("node:fs");
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));
  console.error(`✓ Wrote ${messages.length} turns (${out.counts.participant} participant / ${out.counts.rep} rep) → ${dest}`);
  console.error(`  Title: ${out.title}`);
  console.error(`  Participant: ${out.participantName}`);
}

// Paginate Gong's call list (100/page) over a date window.
async function gongListCalls(days) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const all = [];
  let cursor;
  do {
    const params = new URLSearchParams({
      fromDateTime: from.toISOString(),
      toDateTime: to.toISOString(),
    });
    if (cursor) params.set("cursor", cursor);
    const data = await gong(`/v2/calls?${params.toString()}`);
    for (const c of data.calls || []) all.push(c);
    cursor = data.records?.cursor;
  } while (cursor);
  return all;
}

// Pull a call's transcript + parties and shape it into ordered messages.
// Returns null if there's nothing usable.
async function assembleCall(callId) {
  const [{ meta, partyMap }, transcript] = await Promise.all([
    getParties(callId),
    getTranscript(callId),
  ]);
  if (!transcript.length) return null;
  const callStartMs = meta.started ? new Date(meta.started).getTime() : Date.now() - 3600_000;
  const rows = [];
  for (const mono of transcript) {
    const party = partyMap.get(mono.speakerId) || { name: "Unknown", affiliation: "Unknown" };
    const role = party.affiliation === "Internal" ? "assistant" : "user"; // External/Unknown -> participant
    const text = (mono.sentences || []).map((s) => s.text).join(" ").trim();
    if (!text) continue;
    rows.push({ role, content: text, offsetMs: (mono.sentences || [])[0]?.start ?? 0 });
  }
  rows.sort((a, b) => a.offsetMs - b.offsetMs);
  if (rows.length < 4) return null;
  const externalNames = [...partyMap.values()].filter((p) => p.affiliation === "External").map((p) => p.name);
  return {
    title: meta.title || callId,
    participantName: externalNames[0] || "Gong Import",
    startedAt: meta.started || new Date().toISOString(),
    messages: rows.map((r, i) => ({
      role: r.role,
      content: r.content,
      created_at: new Date(callStartMs + i * 1000).toISOString(),
    })),
  };
}

// Write one assembled call as a completed interview. Idempotent: access_token = gong-<callId>.
// Returns { status: 'imported'|'skipped'|'empty', ... }.
async function writeCall(db, project, callId) {
  const token = `gong-${callId}`;
  const { data: existing } = await db.from("interviews").select("id").eq("access_token", token).maybeSingle();
  if (existing) return { status: "skipped", interviewId: existing.id };

  const data = await assembleCall(callId);
  if (!data) return { status: "empty" };

  const nowIso = new Date().toISOString();
  const { data: interview, error: iErr } = await db
    .from("interviews")
    .insert({
      project_id: project.id,
      user_id: project.user_id,
      access_token: token,
      participant_name: data.participantName,
      status: "completed",
      started_at: data.startedAt,
      completed_at: nowIso,
    })
    .select()
    .single();
  if (iErr) throw new Error(`interview insert: ${iErr.message}`);

  const messages = data.messages.map((m) => ({ ...m, interview_id: interview.id }));
  const { error: mErr } = await db.from("messages").insert(messages);
  if (mErr) throw new Error(`messages insert: ${mErr.message}`);

  return {
    status: "imported",
    interviewId: interview.id,
    title: data.title,
    participant: data.participantName,
    turns: messages.length,
  };
}

async function loadProject(db, projectId) {
  const { data: project, error } = await db
    .from("projects")
    .select("id, name, user_id")
    .eq("id", projectId)
    .single();
  if (error || !project) {
    console.error(`✗ Project ${projectId} not found.`);
    process.exit(1);
  }
  return project;
}

async function importCall(callId, projectId) {
  if (!callId || !projectId) {
    console.error("Usage: node scripts/import-gong.mjs import <callId> <projectId>");
    process.exit(1);
  }
  const db = supa();
  const project = await loadProject(db, projectId);
  console.log(`Importing call ${callId}…`);
  const r = await writeCall(db, project, callId);
  if (r.status === "skipped") return console.log(`• Already imported (interview ${r.interviewId}).`);
  if (r.status === "empty") return console.log(`✗ No usable transcript for ${callId}.`);
  console.log(`\n✓ Imported "${r.title}" → interview ${r.interviewId} (${r.turns} turns, participant: ${r.participant})`);
  console.log(`  Project: ${project.name}`);
}

async function bulkImport(projectId, n, days) {
  if (!projectId) {
    console.error("Usage: node scripts/import-gong.mjs bulk <projectId> [count=20] [days=120]");
    process.exit(1);
  }
  const limit = n ? Number(n) : 20;
  const window = days ? Number(days) : 120;
  const db = supa();
  const project = await loadProject(db, projectId);

  console.log(`Listing Gong calls (last ${window} days)…`);
  const all = await gongListCalls(window);
  const enterprise = all.filter((c) => /enterprise/i.test(c.title || ""));
  // Most recent first, then take the first N.
  enterprise.sort((a, b) => new Date(b.started || 0) - new Date(a.started || 0));
  const targets = enterprise.slice(0, limit);
  console.log(`Found ${all.length} calls total, ${enterprise.length} "enterprise" titled. Importing ${targets.length} into "${project.name}".\n`);

  let imported = 0, skipped = 0, empty = 0, failed = 0;
  for (const c of targets) {
    try {
      const r = await writeCall(db, project, c.id);
      if (r.status === "imported") { imported++; console.log(`✓ ${r.title}  (${r.turns} turns, ${r.participant})`); }
      else if (r.status === "skipped") { skipped++; console.log(`• skip (already imported): ${c.title}`); }
      else { empty++; console.log(`– no transcript: ${c.title}`); }
    } catch (e) {
      failed++; console.log(`✗ failed: ${c.title} — ${e.message}`);
    }
    await new Promise((res) => setTimeout(res, 400)); // be gentle on the Gong API
  }
  console.log(`\nDone. imported=${imported} skipped=${skipped} no-transcript=${empty} failed=${failed}`);
  console.log(`\nNext: in the app → "${project.name}" → generate snapshots → opportunities aggregate into one OST.`);
}

// ---------- main ----------
const [cmd, a, b, c] = process.argv.slice(2);
try {
  if (cmd === "projects") await listProjects();
  else if (cmd === "calls") await listCalls(a ? Number(a) : 30);
  else if (cmd === "fetch") await fetchCall(a, b);
  else if (cmd === "import") await importCall(a, b);
  else if (cmd === "bulk") await bulkImport(a, b, c);
  else {
    console.log(`Gong → Discovery Co-Pilot import (PoC)

  node scripts/import-gong.mjs projects                       list projects (get a <projectId>)
  node scripts/import-gong.mjs calls [days]                   list recent Gong calls (get a <callId>)
  node scripts/import-gong.mjs import <callId> <projectId>    import one call
  node scripts/import-gong.mjs bulk <projectId> [count=20] [days=120]   import N "Enterprise" calls
`);
  }
} catch (err) {
  console.error("\n✗ Error:", err.message);
  process.exit(1);
}
