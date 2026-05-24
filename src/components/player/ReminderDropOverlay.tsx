"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { X, Loader2, Pencil } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  createSpeechSession,
  speechSupported,
  type SpeechSession,
} from "@/lib/voice/speech";
import { parseReminder, type ParsedReminder } from "@/lib/reminders/parse";

export interface ReminderAnchor {
  episodeId: Id<"episodes">;
  audioAnchorMs: number;
  lineId?: Id<"dialogueLines">;
  chunkId?: Id<"chunks">;
  chunkExcerpt?: string;
  itemTitle?: string;
}

export function ReminderDropOverlay({
  anchor,
  onClose,
}: {
  anchor: ReminderAnchor;
  onClose: () => void;
}) {
  const createReminder = useMutation(api.reminders.createReminder);
  const sessionRef = useRef<SpeechSession | null>(null);

  const [typing, setTyping] = useState(() => !speechSupported());
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedReminder | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleText(text: string) {
    setTranscript(text);
    if (!text.trim()) return;
    try {
      const p = parseReminder(text);
      setParsed(p);
      setLabel(p.label);
      setError(null);
    } catch (e) {
      setParsed(null);
      setError(e instanceof Error ? e.message : "Could not read that.");
    }
  }

  // Listen on mount (unless typing). Clean up the recognizer on unmount.
  useEffect(() => {
    if (typing) return;
    const s = createSpeechSession({ lang: "en-US" });
    if (!s) {
      setTyping(true);
      return;
    }
    sessionRef.current = s;
    s.onInterim((t) => setTranscript(t));
    s.onFinal((t) => handleText(t));
    s.onError((msg) => {
      if (msg === "not-allowed" || msg === "service-not-allowed") {
        setError("Microphone access was blocked. Type your reminder instead.");
      } else if (msg === "no-speech") {
        setError("I did not hear anything. Try again, or type it instead.");
      } else {
        setError("Did not catch that. Type it instead.");
      }
      setTyping(true);
    });
    try {
      s.start();
    } catch {
      setError("Could not start the microphone. Type your reminder instead.");
      setTyping(true);
    }
    return () => {
      s.abort();
      sessionRef.current = null;
    };
  }, [typing]);

  async function confirm() {
    if (!parsed) return;
    setSaving(true);
    try {
      await createReminder({
        scheduledFor: parsed.scheduledFor,
        label: label.trim() || parsed.label,
        episodeId: anchor.episodeId,
        audioAnchorMs: anchor.audioAnchorMs,
        ...(anchor.lineId ? { lineId: anchor.lineId } : {}),
        ...(anchor.chunkId ? { chunkId: anchor.chunkId } : {}),
        ...(anchor.chunkExcerpt ? { chunkExcerpt: anchor.chunkExcerpt } : {}),
        ...(anchor.itemTitle ? { itemTitle: anchor.itemTitle } : {}),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the reminder.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="fixed left-1/2 -translate-x-1/2 w-[480px] max-w-[calc(100vw-32px)] p-6"
        style={{
          bottom: 128,
          background: "rgba(27,27,32,0.95)",
          backdropFilter: "blur(32px) saturate(160%)",
          border: "1px solid var(--color-border-accent)",
          borderRadius: "var(--radius-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {!parsed && !typing ? <span className="pulse-dot" aria-hidden /> : null}
            <span
              className="text-[12px] font-medium tracking-wide"
              style={{ color: "var(--color-ink-muted)" }}
            >
              {parsed
                ? "Confirm reminder"
                : typing
                  ? "Type your reminder"
                  : "Listening..."}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cancel"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {!parsed ? (
          typing ? (
            <div className="flex flex-col gap-3">
              <textarea
                autoFocus
                rows={2}
                placeholder='e.g. "Sunday at 7pm, review the part about attention sinks"'
                className="w-full p-3 rounded-md text-[15px] outline-none resize-none"
                style={{
                  background: "var(--color-surface-3)",
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-ink-primary)",
                }}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleText((e.target as HTMLTextAreaElement).value);
                  }
                }}
              />
              <button
                onClick={() => handleText(transcript)}
                className="self-start h-10 px-5 rounded-md text-[14px] font-medium"
                style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
              >
                Set reminder
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p
                className="text-[22px] leading-snug min-h-[2em]"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {transcript || (
                  <span style={{ color: "var(--color-ink-muted)" }}>
                    Say when, and what to remember...
                  </span>
                )}
              </p>
              <button
                onClick={() => {
                  sessionRef.current?.abort();
                  setTyping(true);
                }}
                className="self-start flex items-center gap-1.5 text-[13px]"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                <Pencil size={13} /> Type instead
              </button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div
                className="text-[11px] font-semibold tracking-widest uppercase mb-1"
                style={{ color: "var(--color-ink-muted)" }}
              >
                {formatWhen(parsed.scheduledFor)}
              </div>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full h-11 px-3 rounded-md text-[17px] outline-none"
                style={{
                  background: "var(--color-surface-3)",
                  border: "1px solid var(--color-border-subtle)",
                  color: "var(--color-ink-primary)",
                }}
              />
            </div>
            {anchor.chunkExcerpt ? (
              <p
                className="text-[13px] leading-relaxed line-clamp-3 pl-3"
                style={{
                  color: "var(--color-ink-muted)",
                  borderLeft: "3px solid var(--color-accent)",
                }}
              >
                {anchor.chunkExcerpt}
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <button
                onClick={confirm}
                disabled={saving}
                className="h-10 px-5 rounded-md text-[14px] font-medium flex items-center gap-2 disabled:opacity-60"
                style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                Confirm
              </button>
              <button
                onClick={() => {
                  setParsed(null);
                  setError(null);
                  setTyping(true);
                }}
                className="h-10 px-4 rounded-md text-[14px]"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-3 text-[13px]" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
