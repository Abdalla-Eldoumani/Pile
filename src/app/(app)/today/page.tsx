// Implements T8.4 in TASKS.md.
// Subscribes to today's Episode document; renders generation progress as it streams.

import { AuthBridgeStatus } from "@/components/AuthBridgeStatus";

export default function TodayPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10">
        <div
          className="text-[11px] font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--color-ink-muted)" }}
        >
          Today
        </div>
        <h1
          className="font-display tracking-tight"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: 1.04,
            fontVariationSettings: '"opsz" 144, "wght" 320',
          }}
        >
          Your morning brief.
        </h1>
      </header>

      {/* TODO(T8.4):
          - if today's Episode exists: render <EpisodeHero episode={...} />
          - else if Pile has >= 2 items: render <GenerateTodayCTA />
          - else: render the empty Pile prompt
        */}
      <div
        className="rounded-xl p-10"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <p style={{ color: "var(--color-ink-secondary)" }}>
          Add at least two items to your Pile to generate today{`'`}s episode.
        </p>
        <AuthBridgeStatus />
      </div>
    </div>
  );
}
