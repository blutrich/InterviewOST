/**
 * Tail-buffered, marker-stripping transform for the Interviewer agent's
 * streaming text. Pure (no I/O), so it's trivial to reason about and to
 * unit-test if someone wants to.
 *
 * The cleaner exists because:
 *   - We stream raw agent tokens to the avatar via Anam's TalkMessageStream.
 *   - The agent emits `[INTERVIEW_COMPLETE]` as a sentinel on the final
 *     turn; the avatar must never speak the literal text.
 *   - A token boundary can split the marker across chunks, so we can't
 *     do a simple per-chunk regex on its own.
 *
 * Strategy:
 *   1. Keep a tail buffer of `TAIL_SIZE` chars (> marker length).
 *   2. On each chunk, append to the buffer. If it exceeds TAIL_SIZE, emit
 *      the overflow (with a defensive marker strip in case the agent ever
 *      puts the marker mid-response, which it shouldn't but might).
 *   3. At end of stream, strip the marker from whatever's still in the
 *      tail buffer and emit that.
 *
 * On the saved-to-Supabase copy we additionally strip internal-thinking
 * patterns (`*[Mental note: ...]*`, `[Internal: ...]`, etc.).
 */

const COMPLETION_MARKER_RE = /\s*\[INTERVIEW_COMPLETE\]\s*/g;

export const COMPLETION_MARKER = "[INTERVIEW_COMPLETE]";
export const DEFAULT_TAIL_SIZE = 32; // strictly greater than marker length

export interface StreamCleanerOptions {
  /** Override the tail buffer size for testing. Defaults to 32. */
  tailSize?: number;
}

export interface StreamCleaner {
  /** Returns the bytes safe to forward to the client right now. May be "". */
  push(chunk: string): string;
  /** Returns the final flush (tail with marker stripped). May be "". */
  flush(): string;
  /** The complete (unstripped) text accumulated so far. */
  getRaw(): string;
}

export function stripCompletionMarker(s: string): string {
  return s.replace(COMPLETION_MARKER_RE, "");
}

export function createStreamCleaner(opts: StreamCleanerOptions = {}): StreamCleaner {
  const TAIL_SIZE = opts.tailSize ?? DEFAULT_TAIL_SIZE;
  let raw = "";
  let tail = "";

  return {
    push(chunk: string): string {
      if (!chunk) return "";
      raw += chunk;
      tail += chunk;
      if (tail.length <= TAIL_SIZE) return "";
      const overflow = tail.slice(0, tail.length - TAIL_SIZE);
      tail = tail.slice(-TAIL_SIZE);
      // Defensive marker strip on the emit path itself (not just the
      // final flush). This catches the unusual case where the agent puts
      // [INTERVIEW_COMPLETE] mid-response instead of at the end.
      return stripCompletionMarker(overflow);
    },
    flush(): string {
      const out = stripCompletionMarker(tail).trimEnd();
      tail = "";
      return out;
    },
    getRaw(): string {
      return raw;
    },
  };
}

/**
 * Storage-time cleaning. Strips internal-thinking annotations and the
 * completion marker, returning the cleaned text and whether the marker
 * was present (used to flip `interviews.status` to "completed").
 */
export function cleanForStorage(raw: string): {
  cleaned: string;
  complete: boolean;
} {
  let s = raw;
  // *[Mental note: ...]*-style
  s = s.replace(/\*\[[\s\S]*?\]\*\s*/g, "");
  // [Internal: ...], [Thinking: ...], etc.
  s = s.replace(
    /\[(?:Internal|Mental note|Note|Thinking|Ready to|Will redirect).*?\]\s*/gi,
    "",
  );
  // Lines that are pure italic thinking
  s = s.replace(/^\s*\*.*(?:probe|redirect|note|track).*\*\s*$/gim, "");
  // Squash extra blank lines
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  const complete = s.includes(COMPLETION_MARKER);
  s = stripCompletionMarker(s).trim();
  return { cleaned: s, complete };
}
