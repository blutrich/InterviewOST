"use client";

/**
 * <VirtualInterviewer />
 *
 * Photoreal Anam avatar that conducts an InterviewOST research interview.
 * Anam owns the I/O layer (camera, mic, STT, TTS, lip-sync). The InterviewOST
 * `interviewerAgent` (Mastra, via /api/chat) owns the brain. This component
 * wires them together.
 *
 * Internals live in this folder:
 *   - useAnamSession    : SDK lifecycle, event listeners, captions, status.
 *   - useBrainTurn      : POST /api/chat, stream-pump into Anam, completion.
 *   - AvatarStage       : video card + idle/connecting/error overlays.
 *   - TypingTray        : slide-up text input.
 *   - avatarConfig.ts   : persona/voice/avatar defaults + CUSTOMER_CLIENT_V1.
 */

import { useCallback, useRef, useState } from "react";
import { Keyboard, Mic } from "lucide-react";
import { useAnamSession, type SessionStatus } from "./useAnamSession";
import { useBrainTurn } from "./useBrainTurn";
import AvatarStage from "./AvatarStage";
import TypingTray from "./TypingTray";
import "./VirtualInterviewer.css";

interface VirtualInterviewerProps {
  interviewId: string;
  token: string;
  participantName: string | null;
  /** Opening line generated upstream during the name-submission step. */
  openingMessage: string;
  /** Display name for the persona shown in the UI chip + caption label. */
  personaName?: string;
  /**
   * Optional override for which Anam Persona to load. Defaults to the
   * project persona configured in avatarConfig.ts. The persona itself
   * owns avatar / voice / system prompt — set those in lab.anam.ai.
   */
  personaId?: string;
  /** Called once when the interview transitions to "completed". */
  onComplete: () => void;
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: "Ready",
  connecting: "Connecting…",
  listening: "Listening",
  speaking: "Speaking",
  thinking: "Thinking…",
  error: "Error",
};

export default function VirtualInterviewer({
  interviewId,
  token,
  participantName,
  openingMessage,
  personaName,
  personaId,
  onComplete,
}: VirtualInterviewerProps) {
  const [typingOpen, setTypingOpen] = useState(false);

  // useAnamSession and useBrainTurn have a mutual dependency: the session
  // needs an onUserUtterance callback that calls brain.runTurn, but
  // useBrainTurn needs session.client. We break the cycle with refs that
  // are populated after both hooks have run (during render, which React
  // explicitly permits).
  const runTurnRef = useRef<((text: string) => Promise<void> | void) | null>(null);
  const speakOpeningHandlerRef = useRef<(() => void) | null>(null);

  const session = useAnamSession({
    token,
    personaId,
    onUserUtterance: useCallback((text: string) => {
      runTurnRef.current?.(text);
    }, []),
    onAvatarReady: useCallback(() => {
      speakOpeningHandlerRef.current?.();
    }, []),
  });

  const brain = useBrainTurn({
    client: session.client,
    interviewId,
    token,
    participantName,
    setStatus: session.setStatus,
    setPersonaCaption: session.setPersonaCaption,
    setErrorMsg: session.setErrorMsg,
    onComplete,
  });

  // Populate the refs so the late-bound callbacks above have a target.
  // Safe per React docs: refs may be written during render.
  runTurnRef.current = brain.runTurn;
  speakOpeningHandlerRef.current = () => {
    if (openingMessage?.trim()) {
      void brain.speakOpening(openingMessage).then(() => session.setStatus("listening"));
    } else {
      session.setStatus("listening");
    }
  };

  const retry = useCallback(() => {
    session.reset();
    void session.start();
  }, [session]);

  const handleStartClick = session.status === "error" ? retry : session.start;

  const isLive =
    session.status === "listening" ||
    session.status === "speaking" ||
    session.status === "thinking";

  return (
    <div className="vi-root">
      <header className="vi-header">
        <span
          className={`vi-status-dot vi-status--${session.status}`}
          aria-hidden="true"
        />
        <span className="vi-persona-name">{personaName ?? "Interviewer"}</span>
        <span className="vi-status-label">{STATUS_LABELS[session.status]}</span>
      </header>

      <AvatarStage
        videoElementId={session.videoElementId}
        status={session.status}
        errorMsg={session.errorMsg}
        onStart={handleStartClick}
        personaName={personaName}
      />

      <div className="vi-captions" aria-live="polite">
        <p className="vi-caption-user">
          {session.userCaption ? (
            <>
              <span className="vi-cap-label">You</span> {session.userCaption}
            </>
          ) : (
            " "
          )}
        </p>
        <p className="vi-caption-persona">
          {session.personaCaption ? (
            <>
              <span className="vi-cap-label">
                {personaName ?? "Interviewer"}
              </span>{" "}
              {session.personaCaption}
            </>
          ) : (
            " "
          )}
        </p>
      </div>

      <div
        className={`vi-mic-dot vi-mic-dot--${session.status}`}
        aria-hidden="true"
      >
        <Mic size={14} strokeWidth={2.25} />
      </div>

      {isLive && !typingOpen && !session.micBlocked && (
        <button
          className="vi-keyboard-toggle"
          onClick={() => setTypingOpen(true)}
          aria-label="Type instead of speaking"
          title="Type instead"
        >
          <Keyboard size={18} strokeWidth={2.25} />
        </button>
      )}

      <TypingTray
        open={typingOpen || session.micBlocked}
        micBlocked={session.micBlocked}
        onSubmit={(text) => {
          session.setUserCaption(text);
          setTypingOpen(false);
          void brain.runTurn(text);
        }}
        onClose={() => setTypingOpen(false)}
      />
    </div>
  );
}
