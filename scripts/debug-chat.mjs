#!/usr/bin/env node
/**
 * Minimal interactive debug script for the interviewer agent.
 *
 * Usage:
 *   node scripts/debug-chat.mjs            # pick a project interactively
 *   node scripts/debug-chat.mjs <index>     # use project by number (1-based)
 *
 * Requires .env.local with OPENROUTER_API_KEY + Supabase credentials.
 *
 * What it does:
 *   - Fetches real projects + active templates from Supabase
 *   - Builds the exact same prompts the /api/chat route sends
 *   - Calls OpenRouter directly (same model as interviewer agent)
 *   - Prints the full system prompt + user prompt on every turn
 *   - Streams the response with timing
 *   - Loops for multi-turn conversation
 */

import { readFileSync } from "fs";
import { createInterface } from "readline";

// ── Load env ────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found — rely on env vars
  }
}
loadEnv();

const API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY not set.");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: Supabase credentials not set (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────────────
const MODEL = "openai/gpt-5";  // same as models.interviewer
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Colors ──────────────────────────────────────────────────────────
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

// ── Supabase helpers ────────────────────────────────────────────────
async function supabaseGet(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function fetchProjects() {
  const projects = await supabaseGet(
    "projects",
    "select=id,name,description,research_goals,target_audience,desired_outcome,status&order=created_at.desc"
  );
  return projects;
}

async function fetchActiveTemplate(projectId) {
  const templates = await supabaseGet(
    "templates",
    `select=id,name,rubric,is_active&project_id=eq.${projectId}&is_active=eq.true&limit=1`
  );
  return templates[0] || null;
}

const DEFAULT_PROJECT_ID = "d6b1a9d4-0e70-4d42-996f-f4804489fffa";

// ── Project picker ──────────────────────────────────────────────────
async function pickProject(rl) {
  const projects = await fetchProjects();

  if (projects.length === 0) {
    console.error("No projects found in Supabase.");
    process.exit(1);
  }

  // Check if index was passed as CLI arg
  const argIndex = parseInt(process.argv[2], 10);
  if (argIndex >= 1 && argIndex <= projects.length) {
    return projects[argIndex - 1];
  }

  // Default project
  const defaultProject = projects.find((p) => p.id === DEFAULT_PROJECT_ID);
  if (defaultProject) {
    return defaultProject;
  }

  console.log(`\n${BOLD}Available projects:${RESET}\n`);
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const status = p.status === "active" ? `${GREEN}active${RESET}` : `${DIM}${p.status}${RESET}`;
    console.log(`  ${BOLD}${i + 1}.${RESET} ${p.name} [${status}]`);
    if (p.research_goals) {
      console.log(`     ${DIM}${p.research_goals.slice(0, 80)}${p.research_goals.length > 80 ? "..." : ""}${RESET}`);
    }
  }

  return new Promise((resolve) => {
    rl.question(`\n${YELLOW}Pick a project (1-${projects.length}): ${RESET}`, (input) => {
      const idx = parseInt(input.trim(), 10) - 1;
      if (idx < 0 || idx >= projects.length) {
        console.error("Invalid selection.");
        process.exit(1);
      }
      resolve(projects[idx]);
    });
  });
}

// ── Prompt builders (same as src/lib/interviewerPrompts.ts) ─────────
function projectContextBlock(project) {
  if (!project) return "";
  return `
## Research Context

**Project:** ${project.name || "Untitled"}
**Research Goals:** ${project.research_goals || "Not specified"}
**Target Audience:** ${project.target_audience || "Not specified"}
**Desired Outcome:** ${project.desired_outcome || "Not specified"}

Use this context to guide your questions and understand what insights we're looking for.
`;
}

function rubricBlock(rubric) {
  if (!rubric) return "";
  return `
## Interview Rubric
${JSON.stringify(rubric, null, 2)}

## Instructions
Follow this rubric to conduct the interview. Start with the introduction if this is the beginning.
Remember to use story-based questions: "Tell me about a time when..."
If the participant gives vague answers, gently redirect to specific examples.
Keep the research goals and desired outcome in mind - probe deeper on topics that relate to them.
`;
}

function buildSystemContext(project, rubric) {
  return `${projectContextBlock(project)}${rubricBlock(rubric)}`;
}

function buildOpeningPrompt(systemContext, interview) {
  const name = interview.participant_name;
  const hasName = name && name !== "Anonymous";
  const greetingRule = hasName
    ? "Greet them warmly by name"
    : "Greet them warmly WITHOUT using any name (just say 'Hi there!' or 'Hello!')";
  const nameLine = hasName
    ? ` The participant's name is "${name}".`
    : " The participant chose not to share their name.";

  return `${systemContext}

The interview is just starting.${nameLine}

Generate ONLY your opening greeting and ONE simple question. Follow these rules:
1. ${greetingRule}
2. Briefly explain the purpose (1-2 sentences max)
3. Ask ONE simple opening question (under 15 words)

DO NOT:
- Ask multiple questions
- Ask compound questions with "and" or "from X to Y"
- Include consent questions (assume consent given)
- Write more than 3-4 sentences total`;
}

function buildTurnPrompt(systemContext, history, message) {
  const conversationHistory = (history || [])
    .map((m) => `${m.role === "user" ? "Participant" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const messageCount = history?.length ?? 0;
  let wrapUpInstruction = "";
  if (messageCount >= 16) {
    wrapUpInstruction = `\n\n**WRAP UP NOW** - This is the final exchange. Thank the participant and end the interview with [INTERVIEW_COMPLETE].`;
  } else if (messageCount >= 12) {
    wrapUpInstruction = "\n\n**Consider wrapping up soon** - You've covered the key ground. Start looking for a natural ending point.";
  }

  return `${systemContext}

## Conversation So Far
${conversationHistory}

## Latest Participant Response
${message}

## Your Task
Respond naturally to continue the interview.
- Do NOT repeat, paraphrase, or recap what the participant just said
- Skip the recap and go straight to your next question
- At most a brief 3-5 word acknowledgment ("Got it.", "That makes sense.") when it adds warmth - then your question
- Ask ONE follow-up question; use story-based probing if the answer was vague
- Keep your whole reply short: 1-2 sentences, ideally under 30 words
- Stay conversational and empathetic${wrapUpInstruction}`;
}

// ── Agent system instructions (from interviewer.ts) ─────────────────
const SYSTEM_INSTRUCTIONS = `You are a skilled interviewer using Teresa Torres' story excavation method.
You conduct qualitative research interviews to uncover real user needs and behaviors.

## CORE RULES

1. **ONE QUESTION AT A TIME - CRITICAL**
   - Ask only ONE simple, focused question per response
   - NEVER ask compound questions like "How did you do X and what was Y?"
   - NEVER ask about multiple phases/aspects in one question
   - Keep each question short - ideally under 20 words

2. **NEVER accept vague answers**
   - If user says "I usually...", "I typically...", or "I generally..."
   - Redirect: "Can you walk me through the most recent specific time this happened?"

3. **NEVER ask leading questions**
   - Bad: "Do you like X?", "Isn't X frustrating?", "Would you prefer Y?"
   - Good: "Tell me about a time when...", "What happened when..."

4. **PROBE THE STORY ARC one step at a time**
   Ask these as SEPARATE follow-up questions, not all at once:
   - What triggered this? Where were you?
   - What happened step by step?
   - How did you feel at that point?
   - What did you do next?
   - What was the outcome?

## INTERVIEW FLOW

1. **Opening (1-2 min)** - Introduce yourself warmly, explain purpose, ask ONE question
2. **Story Excavation (Main Phase)** - Follow rubric, get ONE complete story per topic
3. **Active Listening** - Do NOT repeat/recap what they said. Go straight to next question.
4. **Fact Checking** - Distinguish generalizations from specific instances
5. **Closing** - "Anything else?" + "What haven't I asked?" + Thank them

## OUTPUT FORMAT
- Only output what you would say to the participant
- Do NOT include internal notes, mental notes, or thinking
- Do NOT include text in brackets like [Note:...] or *[Mental note:...]*

## INTERVIEW COMPLETION
Keep interviews SHORT - aim for a few key stories, not exhaustive coverage.
When ending, thank them and end with [INTERVIEW_COMPLETE].`;

// ── OpenRouter call ─────────────────────────────────────────────────
async function callAgent(messages, stream = true) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  if (!stream) {
    const json = await res.json();
    return json.choices[0].message.content;
  }

  let full = "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          process.stdout.write(token);
          full += token;
        }
      } catch {
        // skip malformed chunks
      }
    }
  }
  process.stdout.write("\n");
  return full;
}

// ── REPL ────────────────────────────────────────────────────────────
function printSection(label, content) {
  console.log(`\n${DIM}${"─".repeat(60)}${RESET}`);
  console.log(`${CYAN}${BOLD}[${label}]${RESET}`);
  console.log(`${DIM}${content}${RESET}`);
  console.log(`${DIM}${"─".repeat(60)}${RESET}\n`);
}

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(`${BOLD}Interview Agent Debug REPL${RESET}`);
  console.log(`${DIM}Model: ${MODEL}${RESET}`);
  console.log(`${DIM}Fetching projects from Supabase...${RESET}`);

  // ── Pick project ──
  const project = await pickProject(rl);
  const template = await fetchActiveTemplate(project.id);

  console.log(`\n${BOLD}Project:${RESET} ${project.name} [${project.status}]`);
  if (template) {
    console.log(`${BOLD}Template:${RESET} ${template.name}`);
  } else {
    console.log(`${YELLOW}Warning: No active template found. Running without rubric.${RESET}`);
  }

  console.log(`\n${DIM}Type your responses as the participant. Ctrl+C to quit.${RESET}`);
  console.log(`${DIM}Type "dump" to see full message history.${RESET}\n`);

  const rubric = template?.rubric || null;
  const systemContext = buildSystemContext(project, rubric);
  const history = [];
  const participantName = "Debug User";

  // ── Opening turn ──
  const openingPrompt = buildOpeningPrompt(systemContext, { participant_name: participantName });


  const messages = [
    { role: "system", content: SYSTEM_INSTRUCTIONS },
    { role: "user", content: openingPrompt },
  ];

  console.log(`${GREEN}${BOLD}Agent:${RESET} `);
  const t0 = Date.now();
  const opening = await callAgent(messages);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${DIM}(${elapsed}s)${RESET}\n`);

  history.push({ role: "assistant", content: opening });

  // ── Conversation loop ──
  const ask = () => {
    rl.question(`${YELLOW}${BOLD}You: ${RESET}`, async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return ask();

      if (trimmed.toLowerCase() === "dump") {
        printSection("Full message history", JSON.stringify(history, null, 2));
        return ask();
      }

      const turnPrompt = buildTurnPrompt(systemContext, history, trimmed);

      history.push({ role: "user", content: trimmed });

      const turnMessages = [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        { role: "user", content: turnPrompt },
      ];

      console.log(`${GREEN}${BOLD}Agent:${RESET} `);
      const t1 = Date.now();
      const response = await callAgent(turnMessages);
      const e = ((Date.now() - t1) / 1000).toFixed(1);
      console.log(`${DIM}(${e}s)${RESET}\n`);

      history.push({ role: "assistant", content: response });

      if (response.includes("[INTERVIEW_COMPLETE]")) {
        console.log(`\n${BOLD}Interview completed by agent.${RESET}`);
        rl.close();
        return;
      }

      ask();
    });
  };

  ask();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
