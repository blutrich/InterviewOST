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

// Project generator
export const projectOutputSchema = z.object({
  name: z.string(),
  research_goals: z.string(),
  target_audience: z.string(),
  desired_outcome: z.string(),
});

// Synthesizer — Interview Snapshot (Teresa Torres format)
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
  // Teresa Torres "Insights" column: separate observed FACTS from your
  // INTERPRETATION of them. Each item groups one or more facts with the
  // conclusion drawn from them.
  insights: z.array(
    z.object({
      facts: z.array(z.string()),
      interpretation: z.string(),
    })
  ),
});

// Mapper — opportunity suggestions for the OST
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

// Themer — evidence-grounded theme layer
export const themeSuggestionsSchema = z.object({
  themes: z.array(
    z.object({
      finding: z.string(),
      description: z.string().nullable().optional(),
      member_opportunity_ids: z.array(z.string()).default([]),
      representative_quotes: z
        .array(
          z.object({
            quote: z.string(),
            interview_id: z.string().nullable().optional(),
          })
        )
        .default([]),
    })
  ),
});

// Recommender — one recommendation per tier
export const RECOMMENDATION_TYPES = ["solid", "bold", "moonshot", "standalone"] as const;

export const recommendationSchema = z.object({
  type: z.enum(RECOMMENDATION_TYPES),
  title: z.string().min(1).max(200),
  explanation: z.string().min(1).max(4000),
  rationale: z.string().min(1).max(4000),
  supporting_examples: z.array(z.string().min(1).max(2000)).min(1),
  expected_value: z.string().min(1).max(2000),
  call_to_action: z.string().min(1).max(1000),
});

export const recommendationsOutputSchema = z.object({
  recommendations: z
    .array(recommendationSchema)
    .min(4, "Agent must return all 4 tiers"),
});
