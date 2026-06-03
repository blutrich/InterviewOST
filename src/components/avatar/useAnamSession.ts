"use client";

/**
 * Owns the Anam SDK session: creating the client, wiring event listeners,
 * managing connection status + captions, and tearing down on unmount.
 *
 * Knows nothing about /api/chat or the interview brain — that lives in
 * useBrainTurn. The orchestrator wires the two together.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createClient,
  AnamEvent,
  MessageRole,
  type AnamClient,
  type Message,
  type MessageStreamEvent,
} from "@anam-ai/js-sdk";
import { buildPersonaConfig, SESSION_OPTIONS } from "./avatarConfig";

export type SessionStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "speaking"
  | "thinking"
  | "error";

export interface UseAnamSessionOptions {
  /** Interview access token (used by the token-mint endpoint). */
  token: string;
  /** Optional avatar/persona overrides. */
  personaName?: string;
  voiceId?: string;
  /**
   * Called once per finalized user utterance (Anam fires
   * MESSAGE_HISTORY_UPDATED with a new user message). The hook handles
   * dedup so the callback fires exactly once per turn.
   */
  onUserUtterance: (text: string) => void;
  /** Called once when the first frame of avatar video plays. */
  onAvatarReady: () => void;
}

export interface UseAnamSessionResult {
  /** The Anam client, or null until start() completes. */
  client: AnamClient | null;
  status: SessionStatus;
  setStatus: (s: SessionStatus) => void;
  userCaption: string;
  setUserCaption: (s: string) => void;
  personaCaption: string;
  setPersonaCaption: (s: string) => void;
  micBlocked: boolean;
  errorMsg: string | null;
  setErrorMsg: (s: string | null) => void;
  /** Begin the session. Idempotent — safe to call once. */
  start: () => Promise<void>;
  /** Reset transient state for a retry. */
  reset: () => void;
  /** DOM id of the video element this hook will stream into. */
  videoElementId: string;
}

const VIDEO_ELEMENT_ID = "anam-avatar-video";

export function useAnamSession(opts: UseAnamSessionOptions): UseAnamSessionResult {
  const { token, personaName, voiceId, onUserUtterance, onAvatarReady } = opts;

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [userCaption, setUserCaption] = useState("");
  const [personaCaption, setPersonaCaption] = useState("");
  const [micBlocked, setMicBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [client, setClient] = useState<AnamClient | null>(null);

  // Refs so the listeners (which close over their initial values) always see
  // the latest callbacks and dedup state.
  const onUserUtteranceRef = useRef(onUserUtterance);
  const onAvatarReadyRef = useRef(onAvatarReady);
  useEffect(() => {
    onUserUtteranceRef.current = onUserUtterance;
  }, [onUserUtterance]);
  useEffect(() => {
    onAvatarReadyRef.current = onAvatarReady;
  }, [onAvatarReady]);

  const lastUserMessageIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  const reset = useCallback(() => {
    lastUserMessageIdRef.current = null;
    startedRef.current = false;
    setStatus("idle");
    setUserCaption("");
    setPersonaCaption("");
    setMicBlocked(false);
    setErrorMsg(null);
    setClient(null);
  }, []);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setErrorMsg(null);
    setUserCaption("");
    setPersonaCaption("");
    setStatus("connecting");

    try {
      const personaConfig = buildPersonaConfig({ personaName, voiceId });
      const tokenRes = await fetch("/api/anam-session-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          personaConfig,
          sessionOptions: SESSION_OPTIONS,
        }),
      });
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body?.error ?? `Token request failed (${tokenRes.status})`);
      }
      const { sessionToken } = (await tokenRes.json()) as { sessionToken: string };
      const newClient = createClient(sessionToken);

      // Live captions from the SDK's incremental transcript stream.
      newClient.addListener(
        AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
        (event: MessageStreamEvent) => {
          if (event.role === MessageRole.USER) {
            setUserCaption(event.content);
          } else if (event.role === MessageRole.PERSONA) {
            setPersonaCaption(event.content);
          }
        },
      );

      // Authoritative source for "a new user message was finalized."
      newClient.addListener(
        AnamEvent.MESSAGE_HISTORY_UPDATED,
        (messages: Message[]) => {
          if (!messages?.length) return;
          const lastUser = [...messages]
            .reverse()
            .find((m) => m.role === MessageRole.USER);
          if (!lastUser?.content?.trim()) return;
          if (lastUser.id === lastUserMessageIdRef.current) return;
          lastUserMessageIdRef.current = lastUser.id;
          setUserCaption(lastUser.content);
          onUserUtteranceRef.current(lastUser.content);
        },
      );

      newClient.addListener(AnamEvent.TALK_STREAM_INTERRUPTED, () => {
        setPersonaCaption("");
        setStatus("listening");
      });

      newClient.addListener(AnamEvent.MIC_PERMISSION_DENIED, () => {
        // Not fatal — TTS still works, the participant can type.
        setMicBlocked(true);
      });

      newClient.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        setStatus((s) => (s === "speaking" || s === "thinking" ? s : "idle"));
      });

      newClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        onAvatarReadyRef.current();
      });

      setClient(newClient);
      await newClient.streamToVideoElement(VIDEO_ELEMENT_ID);
    } catch (err) {
      console.error(err);
      const m = err instanceof Error ? err.message : "Failed to start interview.";
      setErrorMsg(m);
      setStatus("error");
      setClient(null);
      startedRef.current = false;
    }
  }, [token, personaName, voiceId]);

  // Teardown on unmount.
  useEffect(() => {
    return () => {
      const c = client;
      if (c) c.stopStreaming().catch(() => {});
    };
    // We intentionally read `client` only at unmount time; the linter wants
    // it in deps but doing so would re-run on every client change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    client,
    status,
    setStatus,
    userCaption,
    setUserCaption,
    personaCaption,
    setPersonaCaption,
    micBlocked,
    errorMsg,
    setErrorMsg,
    start,
    reset,
    videoElementId: VIDEO_ELEMENT_ID,
  };
}
