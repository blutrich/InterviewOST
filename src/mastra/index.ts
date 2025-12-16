import { Mastra } from "@mastra/core/mastra";
import { PostgresStore } from "@mastra/pg";

import { plannerAgent } from "./agents/planner";
import { interviewerAgent } from "./agents/interviewer";
import { synthesizerAgent } from "./agents/synthesizer";
import { mapperAgent } from "./agents/mapper";

// Initialize Mastra with all agents
export const mastra = new Mastra({
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

// Export agents for direct access
export { plannerAgent, interviewerAgent, synthesizerAgent, mapperAgent };
