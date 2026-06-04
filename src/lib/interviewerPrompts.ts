/**
 * Typed re-exports of the pure prompt builders.
 * Implementation lives in interviewerPrompts.mjs (shared with scripts).
 */

export interface ProjectContextFields {
  name?: string | null;
  research_goals?: string | null;
  target_audience?: string | null;
  desired_outcome?: string | null;
}

export interface InterviewContextFields {
  participant_name?: string | null;
}

export interface HistoryMessage {
  role: string;
  content: string;
}

export {
  buildSystemContext,
  buildOpeningPrompt,
  buildTurnPrompt,
} from "./interviewerPrompts.mjs";
