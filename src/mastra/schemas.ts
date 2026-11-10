import { z } from "zod";

// Output schemas for the agents. API routes pass these to
// `agent.generate(prompt, { structuredOutput: { schema } })` and read the
// validated result from `response.object`.

// Planner — story-based interview rubric
export const rubricSchema = z.object({
  introduction: z.string(),
  topics: z.array(
    z.object({
      name: z.string(),
      questions: z.array(
        z.object({
          id: z.string(),
          question: z.string(),
          followUps: z.array(z.string()),
          probes: z.array(z.string()),
          estimatedMinutes: z.number(),
        })
      ),
    })
  ),
  closing: z.string(),
});

// Output schema for the generated project
export const projectOutputSchema = z.object({
  name: z.string(),
  research_goals: z.string(),
  target_audience: z.string(),
  desired_outcome: z.string(),
});

// Zod schema for Interview Snapshot (Teresa Torres format)
export const interviewSnapshotSchema = z.object({
  experience_map: z.array(
    z.object({
      step: z.number(),
      action: z.string(),
      feeling: z.string(),
      timestamp: z.string().optional(),
    })
  ),
  quote_reel: z.array(
    z.object({
      quote: z.string(),
      context: z.string(),
      emotion: z.string(),
    })
  ),
  facts: z.object({
    role: z.string().optional(),
    tools: z.array(z.string()).optional(),
    frequency: z.string().optional(),
    context: z.string().optional(),
    other: z.record(z.any()).optional(),
  }),
  blind_spots: z.array(
    z.object({
      observation: z.string(),
      suggestion: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
});

// Schema for opportunity suggestions from mapper agent
export const opportunitySuggestionsSchema = z.object({
  opportunities: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum(["opportunity", "pain_point", "unmet_need", "workaround"]),
      evidence_quote: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
    })
  ),
  parent_suggestions: z.array(
    z.object({
      opportunity_title: z.string(),
      suggested_parent_title: z.string().nullable(),
      reasoning: z.string(),
      alternative_parents: z.array(z.string()).optional(),
    })
  ),
  potential_duplicates: z.array(
    z.object({
      new_opportunity: z.string(),
      potential_duplicate: z.string(),
      similarity_score: z.enum(["high", "medium", "low"]),
      recommendation: z.enum(["merge", "keep_separate", "review"]),
      reasoning: z.string(),
    })
  ),
});
