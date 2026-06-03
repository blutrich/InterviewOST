/**
 * Streaming-safe annotation stripper for the Interviewer agent's text. Pure
 * (no I/O), so it's trivial to reason about and to unit-test.
 *
 * Two kinds of text must never reach the avatar's TTS / captions:
 *   - the `[INTERVIEW_COMPLETE]` sentinel the agent emits on the final turn,
 *     and
 *   - internal-thinking annotations the agent is instructed NOT to emit but
 *     occasionally still does: `*[Mental note: ...]*`, `[Internal: ...]`,
 *     `[Thinking: ...]`, etc.
 *
 * Both used to be scrubbed server-side before the (non-streaming) response
 * was returned. Now we stream raw tokens to the avatar as they arrive, and a
 * token boundary can split any of these across chunks — so a naive per-chunk
 * regex misses an annotation straddling two emits.
 *
 * Every annotation we care about opens with `[` (optionally preceded by `*`).
 * So the cleaner withholds output from the first unclosed `[` (plus a leading
 * `*`, and a possible trailing `]*` for the `*[...]*` form) until the span is
 * provably complete, then runs the annotation regexes over it before
 * emitting. Bracket-free normal text — the overwhelming majority — streams
 * through with no added latency. A malformed, never-closed bracket is
 * resolved (best-effort) at flush().
 */

const COMPLETION_MARKER_RE = /\s*\[INTERVIEW_COMPLETE\]\s*/g;

export const COMPLETION_MARKER = "[INTERVIEW_COMPLETE]";

/**
 * Bracketed annotations to strip on BOTH the wire and the stored copy. Each
 * opens with `[` or `*[`, which is what the streaming withhold logic guards.
 * (The bare-italic-line case — `*...probe...*` with no brackets — is handled
 * storage-side only; it's line-anchored and far lower risk on the wire.)
 */
const ANNOTATION_RES: RegExp[] = [
  /\*\[[\s\S]*?\]\*\s*/g, // *[Mental note: ...]*
  /\[(?:Internal|Mental note|Note|Thinking|Ready to|Will redirect)[\s\S]*?\]\s*/gi,
  COMPLETION_MARKER_RE, // [INTERVIEW_COMPLETE]
];

export interface StreamCleaner {
  /** Returns the bytes safe to forward to the client right now. May be "". */
  push(chunk: string): string;
  /** Returns the final flush (held tail, annotations stripped). May be "". */
  flush(): string;
  /** The complete (unstripped) text accumulated so far. */
  getRaw(): string;
}

export function stripCompletionMarker(s: string): string {
  return s.replace(COMPLETION_MARKER_RE, "");
}

/** Strip every recognized bracketed annotation (and the marker) from a span. */
function stripAnnotations(s: string): string {
  let out = s;
  for (const re of ANNOTATION_RES) out = out.replace(re, "");
  return out;
}

/**
 * Split `buf` into [emit, hold]: the prefix that's provably outside any
 * pending annotation (with complete annotations stripped), and the suffix
 * that must be withheld until more text arrives. When `final` is true nothing
 * is withheld — any dangling open bracket is stripped best-effort and emitted.
 */
function splitEmittable(buf: string, final: boolean): [string, string] {
  const open = buf.indexOf("[");

  if (open === -1) {
    // No bracket. A trailing `*` could begin a `*[` annotation next chunk, so
    // hold it back (one char) unless we're flushing.
    if (!final && buf.endsWith("*")) return [buf.slice(0, -1), "*"];
    return [buf, ""];
  }

  // Annotation start: include an immediately-preceding `*` (the `*[...]*` form).
  const annStart = open > 0 && buf[open - 1] === "*" ? open - 1 : open;
  const prefix = buf.slice(0, annStart); // bracket-free, safe to emit
  const starLed = buf[annStart] === "*";

  const close = buf.indexOf("]", open);
  if (close === -1) {
    // Unclosed bracket.
    if (final) return [prefix + stripAnnotations(buf.slice(annStart)), ""];
    return [prefix, buf.slice(annStart)];
  }

  // `*[...]*` closes with `]*`, so we need the char after `]` to know the span
  // end. If it isn't here yet, hold (unless flushing).
  let spanEnd = close + 1;
  if (starLed) {
    if (spanEnd >= buf.length && !final) return [prefix, buf.slice(annStart)];
    if (buf[spanEnd] === "*") spanEnd += 1;
  }

  const span = stripAnnotations(buf.slice(annStart, spanEnd));
  const [emitRest, hold] = splitEmittable(buf.slice(spanEnd), final);
  return [prefix + span + emitRest, hold];
}

export function createStreamCleaner(): StreamCleaner {
  let raw = "";
  let buf = ""; // text held back pending a possible annotation

  return {
    push(chunk: string): string {
      if (!chunk) return "";
      raw += chunk;
      buf += chunk;
      const [emit, hold] = splitEmittable(buf, false);
      buf = hold;
      return emit;
    },
    flush(): string {
      const [emit] = splitEmittable(buf, true);
      buf = "";
      return emit.trimEnd();
    },
    getRaw(): string {
      return raw;
    },
  };
}

/**
 * Storage-time cleaning. Strips internal-thinking annotations and the
 * completion marker, returning the cleaned text and whether the marker was
 * present (used to flip `interviews.status` to "completed").
 */
export function cleanForStorage(raw: string): {
  cleaned: string;
  complete: boolean;
} {
  // Detect completion on the raw text — stripAnnotations removes the marker.
  const complete = raw.includes(COMPLETION_MARKER);

  let s = stripAnnotations(raw);
  // Lines that are pure italic thinking (storage-only; line-anchored).
  s = s.replace(/^\s*\*.*(?:probe|redirect|note|track).*\*\s*$/gim, "");
  // Squash extra blank lines.
  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return { cleaned: s, complete };
}
