import { Mastra } from "@mastra/core/mastra";
import { PostgresStore } from "@mastra/pg";

import { plannerAgent } from "./agents/planner";
import { interviewerAgent } from "./agents/interviewer";
import { synthesizerAgent } from "./agents/synthesizer";
import { mapperAgent } from "./agents/mapper";

// Lazy initialization to avoid database connection during build
let _mastra: Mastra | null = null;

function getMastra(): Mastra {
  if (!_mastra) {
    _mastra = new Mastra({
      agents: {
        plannerAgent,
        interviewerAgent,
        synthesizerAgent,
        mapperAgent,
      },
      storage: new PostgresStore({
        connectionString: process.env.DATABASE_URL!,
      }),
    });
  }
  return _mastra;
}

// Export a proxy object that lazily initializes Mastra
export const mastra = {
  getAgent: (name: string) => getMastra().getAgent(name),
};

// Export agents for direct access
export { plannerAgent, interviewerAgent, synthesizerAgent, mapperAgent };
