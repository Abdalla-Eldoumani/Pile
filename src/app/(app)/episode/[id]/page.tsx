// Implements T6.6 in TASKS.md (the wiring): pulls together player, transcript, source excerpt.
// This is the demo page. Get the temporal anchoring sync right or the demo falls apart.

type Params = Promise<{ id: string }>;

export default async function EpisodePage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <div className="grid lg:grid-cols-[1fr_480px] gap-10 max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-16">
      {/* Main column: transcript and metadata */}
      <article>
        <div
          className="text-[11px] font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--color-ink-muted)" }}
        >
          Episode · {id}
        </div>
        <h1
          className="font-display tracking-tight mb-6"
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1.06,
            fontVariationSettings: '"opsz" 120, "wght" 340',
          }}
        >
          Today{`'`}s conversation.
        </h1>

        {/* TODO(T6.5): <TranscriptView episodeId={id} /> renders DialogueLines */}
        <div
          className="rounded-xl p-8"
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border-subtle)",
            color: "var(--color-ink-secondary)",
          }}
        >
          Transcript will render here. Each line is preceded by a Fraunces
          italic speaker label. Cited lines glow on the left edge when active.
        </div>
      </article>

      {/* Right rail: the SourceExcerpt panel (T6.4): the demo magic */}
      <aside className="lg:sticky lg:top-10 lg:self-start">
        <div
          className="rounded-md p-5"
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border-subtle)",
            borderLeft: "3px solid var(--color-accent)",
          }}
        >
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-2"
            style={{ color: "var(--color-ink-muted)" }}
          >
            From · &ldquo;Title of source&rdquo;
          </div>
          <p
            className="text-[17px] leading-relaxed"
            style={{ color: "var(--color-ink-primary)" }}
          >
            The cited chunk text appears here. This updates in real time as the
            audio progresses through DialogueLines that carry a citation.
          </p>
          <div
            className="mt-3 text-[13px]"
            style={{ color: "var(--color-ink-muted)" }}
          >
            p. 4
          </div>
        </div>
      </aside>

      {/* TODO(T6.1): <PlayerBar episodeId={id} /> fixed at bottom */}
    </div>
  );
}
