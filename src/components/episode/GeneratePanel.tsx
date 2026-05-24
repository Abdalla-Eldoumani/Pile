"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { Loader2, Sparkles } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";

const STATUS_LABEL: Record<Doc<"episodes">["status"], string> = {
  queued: "Queued",
  generating: "Writing the script",
  scripted: "Script ready. Rendering audio",
  rendering: "Rendering audio",
  ready: "Episode ready",
  failed: "Generation stopped",
};

const TERMINAL = new Set(["ready", "failed"]);

export function GeneratePanel() {
  const items = useQuery(api.items.list);
  const episode = useQuery(api.episodes.latest);
  const lines = useQuery(
    api.episodes.linesForEpisode,
    episode ? { episodeId: episode._id } : "skip",
  );
  const generate = useAction(api.generate.generateEpisode);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemCount = items?.length ?? 0;
  const canGenerate = itemCount >= 2 && !busy;
  const inFlight = episode ? !TERMINAL.has(episode.status) : false;

  async function onGenerate() {
    if (!items || items.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      await generate({ itemIds: items.map((i) => i._id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        className="flex items-center justify-between gap-6 flex-wrap p-6"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <p style={{ color: "var(--color-ink-secondary)" }}>
          {itemCount < 2
            ? "Add at least two items to your Pile to generate an episode."
            : `Ready to generate from ${itemCount} item${itemCount === 1 ? "" : "s"} in your Pile.`}
        </p>
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-[14px] font-medium transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {busy || inFlight ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {busy || inFlight ? "Generating..." : "Generate today's episode"}
        </button>
      </div>

      {episode ? (
        <div className="flex flex-col gap-6">
          <StatusBanner episode={episode} />
          {lines && lines.length > 0 ? (
            <div
              className="flex flex-col gap-5 p-6 md:p-8"
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: "var(--radius-lg)",
                maxWidth: 768,
              }}
            >
              {lines.map((line) => (
                <div key={line._id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="speaker-label text-[15px]">
                      {line.speaker === "vega" ? "Vega" : "Theo"}
                    </span>
                    {line.citationChunkId ? (
                      <span
                        title="Anchored to a source paragraph"
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                      />
                    ) : null}
                  </div>
                  <p
                    className="text-[17px] leading-relaxed"
                    style={{ color: "var(--color-ink-primary)" }}
                  >
                    {line.text}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-[13px]" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StatusBanner({ episode }: { episode: Doc<"episodes"> }) {
  const terminal = TERMINAL.has(episode.status);
  const failed = episode.status === "failed";
  return (
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{
        background: "var(--color-surface-2)",
        border: `1px solid ${failed ? "var(--color-border-subtle)" : "var(--color-border-accent)"}`,
        borderRadius: "var(--radius-md)",
      }}
    >
      {!terminal ? (
        <Loader2
          size={16}
          className="animate-spin"
          style={{ color: "var(--color-accent)" }}
        />
      ) : null}
      <div className="flex flex-col">
        <span
          className="text-[14px]"
          style={{
            color: failed
              ? "var(--color-danger)"
              : "var(--color-ink-primary)",
          }}
        >
          {STATUS_LABEL[episode.status]}
          {episode.title && episode.status !== "failed" ? `: ${episode.title}` : ""}
        </span>
        {failed && episode.errorMessage ? (
          <span
            className="text-[12px] mt-0.5"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {episode.errorMessage}
          </span>
        ) : null}
      </div>
    </div>
  );
}
