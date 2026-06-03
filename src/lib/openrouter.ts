import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Create OpenRouter provider instance
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Available models for different tasks
export const models = {
  // Primary model for agents
  default: "anthropic/claude-sonnet-4",

  // Model that conducts the live interview (interviewer agent only)
  interviewer: "openai/gpt-5",

  // Fast model for real-time responses
  fast: "anthropic/claude-haiku-latest",

  // Budget-friendly option
  budget: "meta-llama/llama-3.1-70b-instruct",

  // High-quality reasoning
  reasoning: "anthropic/claude-opus-4",
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
