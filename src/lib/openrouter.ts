import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Create OpenRouter provider instance
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Models per task. OpenRouter retires model IDs over time (a retired ID
// returns 404 on every call) — `npm run check:models` verifies these still exist.
export const models = {
  // Primary model for the planner, synthesizer, mapper, themer and project generator
  default: "anthropic/claude-sonnet-5.5",

  // Model that conducts the live interview (interviewer agent only)
  interviewer: "openai/gpt-5.4-mini",

  // Richer, more strategic output for the recommender agent
  recommender: "anthropic/claude-opus-4.8",
} as const;

export type ModelKey = keyof typeof models;

// Model display names for UI
export const modelDisplayNames: Record<string, string> = {
  "anthropic/claude-3.5-sonnet": "Claude 3.5 Sonnet",
  "anthropic/claude-3-haiku": "Claude 3 Haiku",
  "openai/gpt-4o": "GPT-4o",
  "openai/gpt-4o-mini": "GPT-4o Mini",
  "meta-llama/llama-3.1-70b-instruct": "Llama 3.1 70B",
  "meta-llama/llama-3.1-8b-instruct": "Llama 3.1 8B",
  "google/gemini-pro-1.5": "Gemini Pro 1.5",
};

// Available models for user selection
export const availableModels = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "Meta" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5", provider: "Google" },
];
