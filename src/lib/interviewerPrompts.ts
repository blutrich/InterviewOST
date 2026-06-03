/**
 * Pure prompt builders for the Interviewer agent. Kept here (not inside the
 * /api/chat route) so the prompt text is editable without diving into HTTP
 * plumbing, and so the route handler reads as one short pipeline.
 *
 * No I/O, no Supabase, no fetch — just strings in, string out.
 */

export interface ProjectContextFields {
  name?: string | null;
  research_goals?: string | null;
  target_audience?: string | null;
  desired_outcome?: string | null;
}

export interface InterviewContextFields {
  participant_name?: string | null;
}

export interface HistoryMessage {
  role: string;
  content: string;
}

const COMPLETION_MARKER = "[INTERVIEW_COMPLETE]";

function projectContextBlock(project: ProjectContextFields | null | undefined): string {
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

function rubricBlock(rubric: unknown): string {
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

/**
 * Shared system context (project + rubric blocks) used by both opening and
 * turn prompts.
 */
export function buildSystemContext(
  project: ProjectContextFields | null | undefined,
  rubric: unknown,
): string {
  return `${projectContextBlock(project)}${rubricBlock(rubric)}`;
}

/**
 * Prompt used on the very first turn (isStart). Produces the agent's
 * opening greeting + one simple question.
 */
export function buildOpeningPrompt(
  systemContext: string,
  interview: InterviewContextFields,
): string {
  const name = interview.participant_name;
  const hasName = name && name !== "Anonymous";

  const nameLine = hasName
    ? ` The participant's name is "${name}".`
    : " The participant chose not to share their name.";

  const greetingRule = hasName
    ? "Greet them warmly by name"
    : "Greet them warmly WITHOUT using any name (just say 'Hi there!' or 'Hello!')";

  const formatLabel = hasName ? "(WITH name)" : "(NO name)";

  const exampleGreeting = hasName ? `Hi ${name}!` : "Hi there!";
  const example = `"${exampleGreeting} Thanks for joining. I'm researching [topic] and would love to hear about your experiences.

What's your current role?"`;

  const noNameRule = !hasName
    ? "\n- Use any name or say 'Anonymous' - just skip the name entirely"
    : "";

  return `${systemContext}

The interview is just starting.${nameLine}

Generate ONLY your opening greeting and ONE simple question. Follow these rules:
1. ${greetingRule}
2. Briefly explain the purpose (1-2 sentences max)
3. Ask ONE simple opening question (under 15 words)

Example format ${formatLabel}:
${example}

DO NOT:
- Ask multiple questions
- Ask compound questions with "and" or "from X to Y"
- Include consent questions (assume consent given)
- Write more than 3-4 sentences total${noNameRule}`;
}

/**
 * Prompt used for every turn after the opening. Includes conversation
 * history and time-budget hints for graceful wrap-up.
 */
export function buildTurnPrompt(
  systemContext: string,
  history: HistoryMessage[] | null | undefined,
  message: string,
): string {
  const conversationHistory = (history || [])
    .map(
      (m) =>
        `${m.role === "user" ? "Participant" : "Interviewer"}: ${m.content}`,
    )
    .join("\n\n");

  const messageCount = history?.length ?? 0;
  let wrapUpInstruction = "";
  if (messageCount >= 16) {
    wrapUpInstruction = `\n\n**WRAP UP NOW** - This is the final exchange. Thank the participant and end the interview with ${COMPLETION_MARKER}.`;
  } else if (messageCount >= 12) {
    wrapUpInstruction =
      "\n\n**Consider wrapping up soon** - You've covered the key ground. Start looking for a natural ending point.";
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
