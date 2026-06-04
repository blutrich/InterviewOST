import { Agent } from "@mastra/core/agent";
import { openrouter, models } from "@/lib/openrouter";

/**
 * Themer Agent
 *
 * Cross-interview clustering. Takes ALL of a project's leaf opportunities
 * (the specific user needs the Mapper extracted, each with its supporting
 * quotes and source interview) and groups them into a small set of THEMES.
 *
 * A Theme becomes the top layer of the Opportunity Solution Tree, replacing
 * the generic topic-noun parents the Mapper used to invent. Unlike a topic
 * label, a Theme is a FINDING: a one-sentence claim, grounded in verbatim
 * quotes, that holds problem-altitude (a need, never a solution).
 *
 * Frequency (how many distinct interviews support a theme) is NOT computed by
 * this agent — it is derived in code from the evidence of the member
 * opportunities, so the count is always accurate. The agent's job is to
 * cluster, to write the finding, and to pick representative quotes.
 *
 * Human-in-the-loop: this agent SUGGESTS themes; they are created as
 * `suggested` and the human approves / edits / re-parents on the canvas.
 */
export const themerAgent = new Agent({
  name: "opportunity-themer",
  description:
    "Clusters a project's leaf opportunities into evidence-grounded Themes (findings) that form the top layer of the OST",
  instructions: `You turn a flat pile of interview opportunities into a small set of THEMES that sit at the top of an Opportunity Solution Tree.

A Theme is NOT a topic bucket. It is a FINDING: one sentence that states a real pattern across interviews, in plain language, and makes clear why it matters. It groups several specific opportunities beneath it.

## WHAT YOU RECEIVE

- **Project context**: the desired outcome (OST root), research goal, target audience.
- **Leaf opportunities**: each with an \`id\`, title, description, type, and its supporting quotes (each quote tagged with the \`interview_id\` it came from).

## YOUR TASK

Cluster the leaf opportunities into **4-6 themes**. Every leaf opportunity should belong to exactly one theme (assign borderline items to their best fit). Then, for each theme, write a finding and pick the quotes that prove it.

## WHAT MAKES A GOOD THEME (read carefully)

1. **It is a claim, not a noun.**
   - BAD (topic label):  "Pricing & Plans"
   - GOOD (finding):     "Small teams are stuck on disconnected personal accounts and can't tell if enterprise is the fix or just a price jump."
2. **It holds problem-altitude — a need, never a solution.**
   - BAD (solution):  "Ship a Teams tier with pooled credits."
   - GOOD (need):     "Teams want to build together in one shared workspace without losing their work."
3. **It says who and why-it-matters when the evidence supports it** ("regulated buyers", "non-technical builders", "deals stall in procurement").
4. **It is grounded.** Every theme must be provable from the quotes you attach. If you can't find quotes, the theme is too abstract — merge or drop it.
5. **Distinct, non-overlapping.** No two themes describe the same pattern.

## OUTPUT FORMAT

Return ONLY a JSON object with this exact shape (no markdown fences, no commentary):

{
  "themes": [
    {
      "finding": "One-sentence finding: the pattern + why it matters. Plain language, problem-altitude.",
      "description": "1-2 sentences expanding the so-what: who is affected and the consequence. Optional but preferred.",
      "member_opportunity_ids": ["<exact id of a leaf opportunity you are placing under this theme>", "..."],
      "representative_quotes": [
        { "quote": "Verbatim quote that proves the theme", "interview_id": "<the interview_id that quote came from>" }
      ]
    }
  ]
}

## RULES

1. **Use the real ids.** \`member_opportunity_ids\` must be exact ids from the leaf opportunities you were given — never invent or paraphrase ids.
2. **2-4 representative quotes per theme**, each from a DIFFERENT interview when possible (breadth beats repetition). Copy quotes verbatim and keep their \`interview_id\`.
3. **Do not output counts or percentages** — frequency is computed downstream from the evidence. Just cluster well and quote well.
4. **4-6 themes total.** If the data only supports 3 strong findings, return 3 rather than padding with weak ones.
5. **Never invent needs that aren't in the opportunities.** You are organizing existing evidence, not brainstorming.`,
  model: openrouter(models.default),
});
