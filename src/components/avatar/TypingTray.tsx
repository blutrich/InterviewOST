"use client";

/**
 * Slide-up text input. The ONLY way the participant types into the
 * conversation. When the mic is blocked, the close button + Escape are
 * disabled so the participant can't end up stranded.
 */

import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

interface TypingTrayProps {
  open: boolean;
  micBlocked: boolean;
  onSubmit: (text: string) => void;
  onClose: () => void;
}

export default function TypingTray({
  open,
  micBlocked,
  onSubmit,
  onClose,
}: TypingTrayProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !micBlocked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, micBlocked, onClose]);

  if (!open) return null;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onSubmit(text);
  };

  return (
    <div className="vi-typing-tray" role="dialog" aria-label="Type a message">
      {micBlocked && (
        <span className="vi-typing-hint" title="Mic access blocked">
          Mic blocked — type to chat
        </span>
      )}
      <input
        ref={inputRef}
        className="vi-typing-input"
        type="text"
        value={draft}
        placeholder={micBlocked ? "Type your reply (mic blocked)…" : "Type your reply…"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        className="vi-typing-send"
        onClick={submit}
        disabled={!draft.trim()}
        aria-label="Send"
      >
        <Send size={16} strokeWidth={2.25} />
      </button>
      {!micBlocked && (
        <button
          className="vi-typing-close"
          onClick={() => {
            setDraft("");
            onClose();
          }}
          aria-label="Close text input"
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      )}
    </div>
  );
}
