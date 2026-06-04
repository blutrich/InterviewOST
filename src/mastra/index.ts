import { Mastra } from "@mastra/core/mastra";

import { plannerAgent } from "./agents/planner";
import { interviewerAgent } from "./agents/interviewer";
import { synthesizerAgent } from "./agents/synthesizer";
import { mapperAgent } from "./agents/mapper";
import { projectGeneratorAgent } from "./agents/projectGenerator";
import { recommenderAgent } from "./agents/recommender";
import { themerAgent } from "./agents/themer";

// Lazy initialization to avoid issues during build
let _mastra: Mastra | null = null;

function getMastra(): Mastra {
  if (!_mastra) {
    // Note: We use Supabase directly for storage, so Mastra storage is not needed
    _mastra = new Mastra({
      agents: {
        plannerAgent,
        interviewerAgent,
        synthesizerAgent,
        mapperAgent,
        projectGeneratorAgent,
        recommenderAgent,
        themerAgent,
      },
    });
  }
  return _mastra;
}

// Export a proxy object that lazily initializes Mastra
export const mastra = {
  getAgent: (name: string) => getMastra().getAgent(name),
};

// Export agents for direct access
export { plannerAgent, interviewerAgent, synthesizerAgent, mapperAgent, projectGeneratorAgent, recommenderAgent, themerAgent };
