import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

// Input validation schema
const generateProjectSchema = z.object({
  description: z
    .string()
    .min(10, "Please provide a more detailed description (at least 10 characters)")
    .max(500, "Description too long (max 500 characters)"),
});

// Output schema for the generated project
const projectOutputSchema = z.object({
  name: z.string(),
  research_goals: z.string(),
  target_audience: z.string(),
  desired_outcome: z.string(),
});

export async function POST(req: Request) {
  try {
    // Auth check
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limiting
    const identifier = getClientIdentifier(req, user!.id, "project-generate");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.ai);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Validate input
    const body = await req.json();
    const validated = generateProjectSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { description } = validated.data;

    // Get the project generator agent
    const generator = mastra.getAgent("projectGeneratorAgent");

    // Generate project details
    const response = await generator.generate(
      `Generate a research project from this description: "${description}"`
    );

    // Parse the JSON response
    let projectData;
    try {
      const text = response.text;
      // Remove any markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      const jsonStr = jsonMatch[1] || text;
      const parsed = JSON.parse(jsonStr.trim());
      projectData = projectOutputSchema.parse(parsed);
    } catch (parseError) {
      console.error("Failed to parse project generator response:", parseError);
      console.error("Raw response:", response.text);
      return NextResponse.json(
        { error: "Failed to generate project details. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: projectData,
    });
  } catch (error) {
    console.error("Project generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
