import { createServiceClient } from "@/lib/supabase/server";
import { mastra } from "@/mastra";

export async function POST(req: Request) {
  try {
    const { interviewId, token, message, isStart } = await req.json();

    // Validate access token
    const supabase = await createServiceClient();
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("*, templates(rubric), projects(model)")
      .eq("access_token", token)
      .single();

    if (fetchError || !interview) {
      return new Response("Interview not found", { status: 404 });
    }

    if (interview.status !== "active" && !isStart) {
      return new Response("Interview is not active", { status: 403 });
    }

    // Get the rubric from the template
    const rubric = interview.templates?.rubric;
    const model = interview.projects?.model;

    // Save user message to database (skip system messages)
    if (!isStart) {
      await supabase.from("messages").insert({
        interview_id: interviewId,
        role: "user",
        content: message,
      });
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: true });

    // Build the prompt for the interviewer agent
    const interviewer = mastra.getAgent("interviewerAgent");

    // Create context with rubric
    const systemContext = rubric
      ? `
## Interview Rubric
${JSON.stringify(rubric, null, 2)}

## Instructions
Follow this rubric to conduct the interview. Start with the introduction if this is the beginning.
Remember to use story-based questions: "Tell me about a time when..."
If the participant gives vague answers, gently redirect to specific examples.
`
      : "";

    // For the first message, we need to generate the opening
    let prompt = "";
    if (isStart) {
      prompt = `${systemContext}

The interview is just starting with a participant named "${interview.participant_name || "Anonymous"}".
Generate your opening message following the introduction in the rubric.
Be warm and welcoming. Explain the purpose briefly and start with your first question.`;
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

    // Clean up the response - remove internal notes and thinking
    let assistantMessage = response.text;

    // Remove patterns like *[Mental note: ...]* or *[Note: ...]*
    assistantMessage = assistantMessage.replace(/\*\[.*?\]\*\s*/gs, '');

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
    await supabase.from("messages").insert({
      interview_id: interviewId,
      role: "assistant",
      content: assistantMessage,
    });

    // If interview is complete, update the status
    if (isComplete) {
      await supabase
        .from("interviews")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", interviewId);
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
