"use client";

/**
 * Owns the per-turn brain loop: POST /api/chat, pipe the streamed response
 * into Anam's TalkMessageStream so the avatar speaks token-by-token, then
 * check whether the interview transitioned to "completed".
 *
 * Stateless w.r.t. the Anam session — takes the client as a parameter.
 */

import { useCallback, useRef } from "react";
import type { AnamClient } from "@anam-ai/js-sdk";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SessionStatus } from "./useAnamSession";

export interface UseBrainTurnOptions {
  client: AnamClient | null;
  interviewId: string;
  token: string;
  participantName: string | null;
  setStatus: (s: SessionStatus) => void;
  setPersonaCaption: (s: string) => void;
  setErrorMsg: (s: string | null) => void;
  onComplete: () => void;
}

export interface UseBrainTurnResult {
  /** Run a full turn: POST user text, stream the reply to the avatar. */
  runTurn: (message: string) => Promise<void>;
  /** Speak a pre-generated opening line. No /api/chat call. */
  speakOpening: (text: string) => Promise<void>;
  /** True while runTurn is in flight (so the caller can dedup). */
  isTurnInFlight: () => boolean;
}

export function useBrainTurn(opts: UseBrainTurnOptions): UseBrainTurnResult {
  const {
    client,
    interviewId,
    token,
    participantName,
    setStatus,
    setPersonaCaption,
    setErrorMsg,
    onComplete,
  } = opts;

  const clientRef = useRef<AnamClient | null>(client);
  clientRef.current = client;

  const supabase = createSupabaseBrowserClient();
  const turnInFlightRef = useRef(false);
  const completedRef = useRef(false);

  const isTurnInFlight = useCallback(() => turnInFlightRef.current, []);

  const checkCompletion = useCallback(async () => {
    if (completedRef.current) return false;
    const { data } = await supabase
      .from("interviews")
      .select("status")
      .eq("id", interviewId)
      .single();
    if (data?.status === "completed") {
      completedRef.current = true;
      return true;
    }
    return false;
  }, [interviewId, supabase]);

  const pumpStreamToAvatar = useCallback(
    async (response: Response) => {
      const c = clientRef.current;
      if (!c) return;
      if (!response.body) {
        throw new Error("Brain response has no body to stream.");
      }
      const talkStream = c.createTalkMessageStream();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setStatus("speaking");
      setPersonaCaption("");

      try {
        while (true) {
          if (!talkStream.isActive()) break;
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          accumulated += chunk;
          setPersonaCaption(accumulated);
          await talkStream.streamMessageChunk(chunk, false);
        }
        if (talkStream.isActive()) {
          await talkStream.endMessage();
        }
      } finally {
        try {
          reader.cancel();
        } catch {
          // ignore
        }
      }
    },
    [setStatus, setPersonaCaption],
  );

  const runTurn = useCallback(
    async (message: string) => {
      if (turnInFlightRef.current || completedRef.current) return;
      const text = message.trim();
      if (!text) return;
      turnInFlightRef.current = true;
      try {
        setStatus("thinking");
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            token,
            participantName: participantName ?? undefined,
            message: text,
          }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => res.statusText);
          throw new Error(`Brain returned ${res.status}: ${detail}`);
        }
        await pumpStreamToAvatar(res);
        const done = await checkCompletion();
        if (done) {
          setTimeout(() => {
            clientRef.current?.stopStreaming().catch(() => {});
            onComplete();
          }, 400);
          return;
        }
        setStatus("listening");
      } catch (err) {
        console.error(err);
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("error");
      } finally {
        turnInFlightRef.current = false;
      }
    },
    [
      interviewId,
      token,
      participantName,
      pumpStreamToAvatar,
      checkCompletion,
      onComplete,
      setStatus,
      setErrorMsg,
    ],
  );

  const speakOpening = useCallback(
    async (text: string) => {
      const c = clientRef.current;
      if (!c) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setPersonaCaption(trimmed);
      setStatus("speaking");
      try {
        await c.talk(trimmed);
      } catch (err) {
        console.error("Anam talk() failed", err);
      }
    },
    [setPersonaCaption, setStatus],
  );

  return { runTurn, speakOpening, isTurnInFlight };
}
