import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import { projectOutputSchema } from "@/mastra/schemas";
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
    let projectData;
    try {
      const response = await generator.generate(
        `Generate a research project from this description: "${description}"`,
        { structuredOutput: { schema: projectOutputSchema } }
      );
      projectData = response.object;
    } catch (agentError) {
      console.error("Project generator failed to produce valid output:", agentError);
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
