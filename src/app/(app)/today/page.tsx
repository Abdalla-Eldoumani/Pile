// Today: generate an episode from the Pile and watch it come together.
// Implements T8.4.

import { GeneratePanel } from "@/components/episode/GeneratePanel";

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

      <GeneratePanel />
    </div>
  );
}
