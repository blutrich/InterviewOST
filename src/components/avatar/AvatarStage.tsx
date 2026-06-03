"use client";

/**
 * The video card + overlays for idle / connecting / error states. The
 * `status === 'listening' | 'speaking' | 'thinking'` cases let the live
 * avatar show through.
 */

import type { SessionStatus } from "./useAnamSession";

interface AvatarStageProps {
  videoElementId: string;
  status: SessionStatus;
  errorMsg: string | null;
  onStart: () => void;
}

export default function AvatarStage({
  videoElementId,
  status,
  errorMsg,
  onStart,
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
              <>
                <p className="vi-overlay-lede">
                  A short, friendly conversation. Just talk like you would to a
                  person.
                </p>
                <button className="vi-start" onClick={onStart}>
                  Start interview
                </button>
                <p className="vi-overlay-hint">
                  We&apos;ll ask for your mic next.
                </p>
              </>
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
