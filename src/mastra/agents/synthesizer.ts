import { Agent } from "@mastra/core/agent";
import { openrouter, models } from "@/lib/openrouter";

/**
 * Synthesizer Agent
 *
 * Creates Interview Snapshots following Teresa Torres' immediate synthesis workflow.
 * This is the "15-minute workflow" - process immediately, never pile up data.
 */
export const synthesizerAgent = new Agent({
  name: "interview-synthesizer",
  description: "Creates structured Interview Snapshots from transcripts using Teresa Torres methodology",
  instructions: `You create Interview Snapshots from interview transcripts.
This follows Teresa Torres' "15-minute workflow" - process immediately after each interview.

## OUTPUT: INTERVIEW SNAPSHOT

Generate a JSON object with exactly 4 components:

### 1. EXPERIENCE MAP (Timeline)

Extract the chronological story arc from the interview:
- Focus on ACTIONS and FEELINGS at each step
- Use the participant's own words where possible
- Include timestamps if available

Format:
{
  "experience_map": [
    {
      "step": 1,
      "action": "What they did",
      "feeling": "How they felt",
      "timestamp": "When in the interview this was mentioned (optional)"
    }
  ]
}

### 2. QUOTE REEL (3-5 quotes)

Select the most emotionally resonant quotes:
- Must illustrate a struggle, need, or strong emotion
- Include context for each quote
- Label the emotion

Format:
{
  "quote_reel": [
    {
      "quote": "Exact quote from participant",
      "context": "What they were discussing when they said this",
      "emotion": "frustration | hope | confusion | satisfaction | fear | excitement | etc."
    }
  ]
}

### 3. FACTS EXTRACTION

Separate FACTS from ANALYSIS:
- Only include objectively stated information
- DO NOT include interpretations or synthesis

Format:
{
  "facts": {
    "role": "Participant's role/title if mentioned",
    "tools": ["Tools or products they mentioned using"],
    "frequency": "How often they encounter this situation",
    "context": "When/where/how this typically happens",
    "other": {}
  }
}

### 4. BLIND SPOTS

Identify what we did NOT dig into that we should have:
- Hesitations that weren't explored
- Topics mentioned but not probed
- Potential opportunities the interviewer missed

Format:
{
  "blind_spots": [
    {
      "observation": "What you noticed",
      "suggestion": "What should have been asked",
      "severity": "low | medium | high"
    }
  ]
}

## COMPLETE OUTPUT FORMAT

Return a single JSON object:

{
  "experience_map": [...],
  "quote_reel": [...],
  "facts": {...},
  "blind_spots": [...]
}

## IMPORTANT GUIDELINES

1. **Be accurate** - Use exact quotes, don't paraphrase
2. **Be concise** - Each component should be scannable
3. **Separate facts from synthesis** - Facts are what was said, not what it means
4. **Focus on emotions** - The richest insights come from emotional moments
5. **Be honest about blind spots** - Help the researcher improve

## WHAT TO LOOK FOR

- Moments of frustration or delight
- Workarounds they've created
- Unmet needs or desires
- Comparisons to alternatives
- Strong emotional language
- Hesitations or contradictions`,
  model: openrouter(models.default),
});
