"use client";

/**
 * The video card + overlays for idle / connecting / error states. The
 * `status === 'listening' | 'speaking' | 'thinking'` cases let the live
 * avatar show through.
 *
 * The idle overlay is the participant's first impression — a warm, low-
 * pressure invitation card. Copy + look mimic the project's "intro
 * screen" design spec; persona name is interpolated so changing it is a
 * one-line edit in the page.
 */

import { ArrowRight, Clock, Heart } from "lucide-react";
import type { SessionStatus } from "./useAnamSession";

interface AvatarStageProps {
  videoElementId: string;
  status: SessionStatus;
  errorMsg: string | null;
  onStart: () => void;
  /** Persona display name (used in the idle screen's fine print). */
  personaName?: string;
}

export default function AvatarStage({
  videoElementId,
  status,
  errorMsg,
  onStart,
  personaName = "Ava",
}: AvatarStageProps) {
  const isLive =
    status === "listening" || status === "speaking" || status === "thinking";

  return (
    <div className={`vi-stage vi-stage--${status}`}>
      <div className="vi-card">
        <div className="vi-card-backdrop" aria-hidden="true" />
        <video id={videoElementId} className="vi-video" autoPlay playsInline />

        {!isLive && (
          <div className="vi-overlay">
            {status === "idle" && (
              <div className="vi-intro">
                <h1 className="vi-intro-heading">
                  Help us see what&apos;s coming next.
                </h1>
                <p className="vi-intro-body">
                  We&apos;re after the bigger picture — and your perspective
                  is a big part of it. Just talk, in your own words.
                </p>
                <button
                  className="vi-intro-cta"
                  onClick={onStart}
                  aria-label="Start interview"
                >
                  <span>Let&apos;s chat</span>
                  <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
                </button>
                <div className="vi-intro-chips" aria-hidden="true">
                  <span className="vi-chip">
                    <Clock size={13} strokeWidth={2} />
                    Under 5 min
                  </span>
                  <span className="vi-chip">
                    <Heart size={13} strokeWidth={2} />
                    No right answers
                  </span>
                </div>
                <p className="vi-intro-fineprint">
                  {personaName} will say hi, then ask a few open questions.
                </p>
              </div>
            )}
            {status === "connecting" && (
              <p className="vi-overlay-lede">Warming up the camera…</p>
            )}
            {status === "error" && (
              <>
                <p className="vi-overlay-lede vi-overlay-error">
                  {errorMsg ?? "Something went wrong."}
                </p>
                <button className="vi-start" onClick={onStart}>
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
