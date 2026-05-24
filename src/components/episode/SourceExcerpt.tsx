"use client";

/**
 * The source excerpt panel. Shows the chunk the current dialogue line cites, so
 * the source paragraph appears beside the hosts as they discuss it. Cross-fades
 * when the cited chunk changes (keyed re-render + fade-up).
 */
export function SourceExcerpt({
  chunk,
}: {
  chunk: { chunkId: string; text: string; itemTitle: string; pageStart?: number } | null;
}) {
  if (!chunk) {
    return (
      <div
        className="p-6 text-[13px]"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-ink-muted)",
        }}
      >
        The source paragraph appears here as the hosts cite it.
      </div>
    );
  }

  return (
    <div
      key={chunk.chunkId}
      className="fade-up p-6"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border-subtle)",
        borderLeft: "3px solid var(--color-accent)",
        borderRadius: "var(--radius-md)",
        maxWidth: 480,
      }}
    >
      <div
        className="text-[11px] font-semibold tracking-widest uppercase mb-3"
        style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-mono)" }}
      >
        From {chunk.itemTitle}
        {chunk.pageStart !== undefined ? `, p. ${chunk.pageStart}` : ""}
      </div>
      <p
        className="text-[17px] leading-relaxed"
        style={{ color: "var(--color-ink-primary)" }}
      >
        {chunk.text}
      </p>
    </div>
  );
}
