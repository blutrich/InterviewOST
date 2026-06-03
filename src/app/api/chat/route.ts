import { createServiceClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interviewId, token, message, isStart, participantName } = body;

    // Rate limiting - use IP + token as identifier
    const identifier = getClientIdentifier(req, token, "chat");
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_CONFIGS.chat);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Validate access token
    const supabase = await createServiceClient();
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("*, templates(rubric), projects(model, name, research_goals, target_audience, desired_outcome)")
      .eq("access_token", token)
      .single();

    if (fetchError || !interview) {
      return new Response("Interview not found", { status: 404 });
    }

    // Verify interviewId matches the token's interview
    if (interview.id !== interviewId) {
      return new Response("Interview ID mismatch", { status: 403 });
    }

    // If this is the start of an interview, update status to active and set participant name
    if (isStart && interview.status === "pending") {
      const updateData: { status: string; started_at: string; participant_name?: string } = {
        status: "active",
        started_at: new Date().toISOString(),
      };
      if (participantName) {
        updateData.participant_name = participantName;
      }

      const { error: updateError } = await supabase
        .from("interviews")
        .update(updateData)
        .eq("id", interview.id);

      if (updateError) {
        console.error("Failed to activate interview:", updateError);
        return new Response("Failed to start interview", { status: 500 });
      }
      // Update local interview object
      interview.status = "active";
      if (participantName) {
        interview.participant_name = participantName;
      }
    }

    if (interview.status !== "active" && !isStart) {
      return new Response("Interview is not active", { status: 403 });
    }

    // Get the rubric and project context
    const rubric = interview.templates?.rubric;
    const project = interview.projects;

    // Build project context for the agent
    const projectContext = project ? `
## Research Context

**Project:** ${project.name || "Untitled"}
**Research Goals:** ${project.research_goals || "Not specified"}
**Target Audience:** ${project.target_audience || "Not specified"}
**Desired Outcome:** ${project.desired_outcome || "Not specified"}

Use this context to guide your questions and understand what insights we're looking for.
` : "";

    // Save user message to database (skip system messages)
    if (!isStart) {
      const { error: userMsgError } = await supabase.from("messages").insert({
        interview_id: interviewId,
        role: "user",
        content: message,
      });
      if (userMsgError) {
        console.error("Failed to save user message:", userMsgError);
        return new Response("Failed to save message", { status: 500 });
      }
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    // Build the prompt for the interviewer agent
    const interviewer = mastra.getAgent("interviewerAgent");

    // Create context with project goals and rubric
    const systemContext = `${projectContext}${rubric ? `
## Interview Rubric
${JSON.stringify(rubric, null, 2)}

## Instructions
Follow this rubric to conduct the interview. Start with the introduction if this is the beginning.
Remember to use story-based questions: "Tell me about a time when..."
If the participant gives vague answers, gently redirect to specific examples.
Keep the research goals and desired outcome in mind - probe deeper on topics that relate to them.
` : ""}`;

    // For the first message, we need to generate the opening
    let prompt = "";
    if (isStart) {
      prompt = `${systemContext}

The interview is just starting.${interview.participant_name && interview.participant_name !== "Anonymous" ? ` The participant's name is "${interview.participant_name}".` : " The participant chose not to share their name."}

Generate ONLY your opening greeting and ONE simple question. Follow these rules:
1. ${interview.participant_name && interview.participant_name !== "Anonymous" ? "Greet them warmly by name" : "Greet them warmly WITHOUT using any name (just say 'Hi there!' or 'Hello!')"}
2. Briefly explain the purpose (1-2 sentences max)
3. Ask ONE simple opening question (under 15 words)

Example format ${interview.participant_name && interview.participant_name !== "Anonymous" ? "(WITH name)" : "(NO name)"}:
${interview.participant_name && interview.participant_name !== "Anonymous"
  ? `"Hi ${interview.participant_name}! Thanks for joining. I'm researching [topic] and would love to hear about your experiences.

What's your current role?"`
  : `"Hi there! Thanks for joining. I'm researching [topic] and would love to hear about your experiences.

What's your current role?"`}

DO NOT:
- Ask multiple questions
- Ask compound questions with "and" or "from X to Y"
- Include consent questions (assume consent given)
- Write more than 3-4 sentences total
${!interview.participant_name || interview.participant_name === "Anonymous" ? "- Use any name or say 'Anonymous' - just skip the name entirely" : ""}`;
    } else {
      // Build conversation context
      const conversationHistory = (history || [])
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "Participant" : "Interviewer"}: ${m.content}`)
        .join("\n\n");

      // Count messages to determine wrap-up timing
      const messageCount = (history || []).length;
      let wrapUpInstruction = "";

      if (messageCount >= 28) {
        wrapUpInstruction = "\n\n**WRAP UP NOW** - This is the final exchange. Thank the participant and end the interview with [INTERVIEW_COMPLETE].";
      } else if (messageCount >= 24) {
        wrapUpInstruction = "\n\n**Consider wrapping up soon** - You've had a good conversation. Start looking for a natural ending point.";
      }

      prompt = `${systemContext}

## Conversation So Far
${conversationHistory}

## Latest Participant Response
${message}

## Your Task
Respond naturally to continue the interview.
- Acknowledge their response
- Ask follow-up questions if needed
- Move to the next topic if appropriate
- Use story-based probing if answers are vague
- Stay conversational and empathetic${wrapUpInstruction}`;
    }

    // Generate response using the interviewer agent
    const response = await interviewer.generate(prompt);

    if (!response || !response.text) {
      console.error("Agent returned empty response:", JSON.stringify(response));
      return new Response("Agent returned empty response", { status: 500 });
    }

    // Clean up the response - remove internal notes and thinking
    let assistantMessage = response.text;

    // Remove patterns like *[Mental note: ...]* or *[Note: ...]*
    assistantMessage = assistantMessage.replace(/\*\[[\s\S]*?\]\*\s*/g, '');

    // Remove patterns like [Internal: ...] or [Thinking: ...]
    assistantMessage = assistantMessage.replace(/\[(?:Internal|Mental note|Note|Thinking|Ready to|Will redirect).*?\]\s*/gi, '');

    // Remove lines that start with thinking indicators
    assistantMessage = assistantMessage.replace(/^\s*\*.*(?:probe|redirect|note|track).*\*\s*$/gim, '');

    // Clean up extra whitespace
    assistantMessage = assistantMessage.replace(/\n{3,}/g, '\n\n').trim();

    // Check for interview completion marker
    const isComplete = assistantMessage.includes('[INTERVIEW_COMPLETE]');

    // Remove the completion marker before saving (it's for internal use only)
    assistantMessage = assistantMessage.replace(/\s*\[INTERVIEW_COMPLETE\]\s*/g, '').trim();

    // Save assistant message to database
    const { error: assistantMsgError } = await supabase.from("messages").insert({
      interview_id: interviewId,
      role: "assistant",
      content: assistantMessage,
    });
    if (assistantMsgError) {
      console.error("Failed to save assistant message:", assistantMsgError);
      // Still return the response to user, but log the error
      // The message was generated successfully, just not persisted
    }

    // If interview is complete, update the status
    if (isComplete) {
      const { error: completeError } = await supabase
        .from("interviews")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", interviewId);
      if (completeError) {
        console.error("Failed to mark interview complete:", completeError);
        // Don't fail the request, but log the error
      }
    }

    // Return the response
    // For now, return as a simple response (streaming can be added later)
    return new Response(assistantMessage, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
