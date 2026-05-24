"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Play, Pause } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Waveform } from "@/components/player/Waveform";
import { SourceExcerpt } from "@/components/episode/SourceExcerpt";
import { formatMs } from "@/lib/utils";

export function EpisodeView({ episodeId }: { episodeId: Id<"episodes"> }) {
  const episode = useQuery(api.episodes.byId, { episodeId });
  const audioUrl = useQuery(api.episodes.audioUrl, { episodeId });
  const lines = useQuery(api.episodes.linesForEpisode, { episodeId });
  const marks = useQuery(api.episodes.timingForEpisode, { episodeId });
  const cited = useQuery(api.episodes.citedChunks, { episodeId });

  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Read currentTime on every frame: background tabs throttle timers, but the
  // source-excerpt sync must stay tight (EDGE_CASES "Browser tab inactive").
  const tick = useCallback(() => {
    const a = audioRef.current;
    if (a) setCurrentMs(a.currentTime * 1000);
    rafRef.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => {
    if (playing) rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, tick]);

  // Current line = the latest timing mark whose start is at or before now.
  let currentLineId: Id<"dialogueLines"> | null = null;
  for (const m of marks ?? []) {
    if (m.startMs <= currentMs) currentLineId = m.lineId;
    else break;
  }
  const currentLine = lines?.find((l) => l._id === currentLineId) ?? null;
  const currentChunkId = currentLine?.citationChunkId ?? null;
  const currentChunk = currentChunkId
    ? (cited?.find((c) => c.chunkId === currentChunkId) ?? null)
    : null;

  const durationMs = episode?.durationMs ?? 0;
  const progress = durationMs > 0 ? Math.min(1, currentMs / durationMs) : 0;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };
  const seek = (fraction: number) => {
    const a = audioRef.current;
    if (!a || !durationMs) return;
    a.currentTime = (fraction * durationMs) / 1000;
    setCurrentMs(fraction * durationMs);
  };

  if (episode === undefined) {
    return <p style={{ color: "var(--color-ink-muted)" }}>Loading episode...</p>;
  }
  if (episode === null) {
    return (
      <p style={{ color: "var(--color-ink-muted)" }}>
        This episode was not found.
      </p>
    );
  }

  const ready = episode.status === "ready" && !!audioUrl;

  return (
    <div className="pb-40">
      <header className="mb-8">
        <div
          className="text-[11px] font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--color-ink-muted)" }}
        >
          Episode
        </div>
        <h1
          className="font-display tracking-tight"
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 1.06,
            fontVariationSettings: '"opsz" 120, "wght" 340',
          }}
        >
          {episode.title ?? "Untitled episode"}
        </h1>
        {!ready ? (
          <p className="mt-3 text-[14px]" style={{ color: "var(--color-ink-muted)" }}>
            {episode.status === "failed"
              ? (episode.errorMessage ?? "This episode did not finish.")
              : "This episode is still being prepared."}
          </p>
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]">
        {/* Transcript */}
        <div className="flex flex-col gap-5" style={{ maxWidth: 720 }}>
          {(lines ?? []).map((line) => {
            const active = line._id === currentLineId;
            return (
              <button
                key={line._id}
                onClick={() => {
                  const mark = (marks ?? []).find((m) => m.lineId === line._id);
                  if (mark && durationMs) seek(mark.startMs / durationMs);
                }}
                className="text-left transition-opacity"
                style={{ opacity: active ? 1 : 0.55 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="speaker-label text-[15px]">
                    {line.speaker === "vega" ? "Vega" : "Theo"}
                  </span>
                  {line.citationChunkId ? (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--color-accent)" }}
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p
                  className="text-[17px] leading-relaxed"
                  style={{
                    color: active
                      ? "var(--color-ink-primary)"
                      : "var(--color-ink-secondary)",
                  }}
                >
                  {line.text}
                </p>
              </button>
            );
          })}
        </div>

        {/* Source excerpt rail */}
        <div className="lg:sticky lg:top-10 self-start w-full">
          <SourceExcerpt chunk={currentChunk} />
        </div>
      </div>

      {/* Player bar */}
      {ready ? (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 safe-bottom"
          style={{
            bottom: 16,
            width: "clamp(640px, 80vw, 1100px)",
            maxWidth: "calc(100vw - 32px)",
            height: 96,
            background: "rgba(19,19,22,0.85)",
            backdropFilter: "blur(24px) saturate(140%)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-2xl)",
          }}
        >
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="shrink-0 flex items-center justify-center rounded-full transition-all hover:brightness-110"
            style={{
              width: 48,
              height: 48,
              background: "var(--color-accent)",
              color: "var(--color-bg)",
            }}
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="min-w-0 w-[200px] shrink-0">
            {currentLine ? (
              <p className="truncate text-[13px]">
                <span className="speaker-label">
                  {currentLine.speaker === "vega" ? "Vega" : "Theo"}
                </span>{" "}
                <span style={{ color: "var(--color-ink-secondary)" }}>
                  {currentLine.text.slice(0, 60)}
                </span>
              </p>
            ) : (
              <span className="text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
                Ready to play
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Waveform
              waveform={episode.waveform ?? []}
              progress={progress}
              onSeek={seek}
            />
          </div>

          <div
            className="shrink-0 text-[13px]"
            style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-mono)" }}
          >
            {formatMs(currentMs)} / {formatMs(durationMs)}
          </div>
        </div>
      ) : null}

      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentMs(e.currentTarget.currentTime * 1000)}
      />
    </div>
  );
}
