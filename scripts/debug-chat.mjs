#!/usr/bin/env node
/**
 * Minimal interactive debug script for the interviewer agent.
 *
 * Usage:
 *   node scripts/debug-chat.mjs
 *
 * Requires OPENROUTER_API_KEY in .env.local (or environment).
 *
 * What it does:
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
if (!API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY not set. Create .env.local or export it.");
  process.exit(1);
}

// ── Config ──────────────────────────────────────────────────────────
const MODEL = "openai/gpt-5";  // same as models.interviewer
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── Fake project + rubric (edit these to test different scenarios) ──
const PROJECT = {
  name: "Debug Test Project",
  research_goals: "Understand how users discover and evaluate new SaaS tools",
  target_audience: "Product managers at mid-size companies",
  desired_outcome: "Identify key pain points in tool evaluation workflow",
};

const RUBRIC = {
  introduction: "We're researching how product managers find and evaluate new tools for their teams.",
  topics: [
    {
      name: "Discovery",
      question: "Tell me about the last time you needed to find a new tool for your team.",
      follow_ups: [
        "What triggered that need?",
        "Where did you start looking?",
        "How long did the process take?",
      ],
    },
    {
      name: "Evaluation",
      question: "Walk me through how you evaluated the options.",
      follow_ups: [
        "Who else was involved?",
        "What criteria mattered most?",
        "What made you choose one over another?",
      ],
    },
  ],
  closing: "Thank you for sharing your experiences!",
};

// ── Prompt builders (copied from src/lib/interviewerPrompts.ts) ─────
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

  // Stream and print tokens as they arrive
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
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function printSection(label, content) {
  console.log(`\n${DIM}${"─".repeat(60)}${RESET}`);
  console.log(`${CYAN}${BOLD}[${label}]${RESET}`);
  console.log(`${DIM}${content}${RESET}`);
  console.log(`${DIM}${"─".repeat(60)}${RESET}\n`);
}

async function main() {
  console.log(`${BOLD}Interview Agent Debug REPL${RESET}`);
  console.log(`${DIM}Model: ${MODEL}${RESET}`);
  console.log(`${DIM}Type your responses as the participant. Ctrl+C to quit.${RESET}`);
  console.log(`${DIM}Type "dump" to see full message history.${RESET}\n`);

  const systemContext = buildSystemContext(PROJECT, RUBRIC);
  const history = []; // {role, content}[]
  const participantName = "Debug User";

  // ── Opening turn ──
  const openingPrompt = buildOpeningPrompt(systemContext, { participant_name: participantName });

  printSection("PROMPT → Agent (opening)", openingPrompt);

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
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    rl.question(`${YELLOW}${BOLD}You: ${RESET}`, async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return ask();

      if (trimmed.toLowerCase() === "dump") {
        printSection("Full message history", JSON.stringify(history, null, 2));
        return ask();
      }

      const turnPrompt = buildTurnPrompt(systemContext, history, trimmed);
      printSection("PROMPT → Agent (turn)", turnPrompt);

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
