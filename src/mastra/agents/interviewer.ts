import { Agent } from "@mastra/core/agent";
import { openrouter, models } from "@/lib/openrouter";
import { INTERVIEWER_INSTRUCTIONS } from "./interviewerInstructions.mjs";

/**
 * Interviewer Agent
 *
 * Conducts interviews using Teresa Torres' story excavation technique.
 * Focuses on gathering specific past behaviors, not opinions or hypotheticals.
 */
export const interviewerAgent = new Agent({
  name: "story-based-interviewer",
  description: "Conducts interviews focused on specific past behaviors using Teresa Torres methodology",
  instructions: INTERVIEWER_INSTRUCTIONS,
  model: openrouter(models.interviewer),
});
