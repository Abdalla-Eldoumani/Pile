// Implements T8.1 + T8.2 in TASKS.md.
// Phase 8 owner: B (Frontend).
// Read .agent/DESIGN_SYSTEM.md for the Pile grid card spec before fleshing this out.

export default function LibraryPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-12 flex items-baseline justify-between gap-6 flex-wrap">
        <h1
          className="font-display tracking-tight"
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1.06,
            fontVariationSettings: '"opsz" 120, "wght" 340',
          }}
        >
          Library
        </h1>
        <button
          className="px-5 py-2.5 rounded-md text-[14px] font-medium transition-all hover:brightness-110"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          + Add to Pile
        </button>
      </header>

      {/* Empty state: refer to EDGE_CASES "First-launch experience" */}
      <div
        className="rounded-xl p-12 text-center"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <h2
          className="font-display mb-3"
          style={{
            fontSize: "32px",
            lineHeight: 1.2,
            fontVariationSettings: '"opsz" 96, "wght" 360',
            color: "var(--color-ink-primary)",
          }}
        >
          Nothing in your Pile yet.
        </h2>
        <p
          className="max-w-md mx-auto mb-8"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Paste a link to your first article, drop a PDF, or share a YouTube
          talk. We{`'`}ll do the rest tomorrow morning.
        </p>
        {/* TODO(T8.3): replace with <AddItemDialog /> trigger */}
        <button
          className="px-5 py-2.5 rounded-md text-[14px] font-medium"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
          }}
        >
          Paste a link
        </button>
      </div>
    </div>
  );
}
