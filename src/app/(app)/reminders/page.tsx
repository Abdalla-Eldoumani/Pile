// Implements T7.6 in TASKS.md.

import { RemindersList } from "@/components/reminders/RemindersList";

export default function RemindersPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10">
        <div
          className="text-[11px] font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--color-ink-muted)" }}
        >
          Reminders
        </div>
        <h1
          className="font-display tracking-tight"
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            lineHeight: 1.06,
            fontVariationSettings: '"opsz" 120, "wght" 340',
          }}
        >
          Anchored moments.
        </h1>
        <p
          className="mt-4 max-w-[560px]"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Every time you pause mid-episode to drop a voice reminder, the
          moment lands here. Click any card to jump straight back to that
          second of audio and the paragraph that triggered it.
        </p>
      </header>

      <RemindersList />
    </div>
  );
}
