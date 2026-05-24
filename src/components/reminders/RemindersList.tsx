"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { ReminderCard } from "./ReminderCard";

export function RemindersList() {
  const reminders = useQuery(api.reminders.list);

  if (reminders === undefined) {
    return (
      <p className="text-[14px]" style={{ color: "var(--color-ink-muted)" }}>
        Loading your reminders...
      </p>
    );
  }

  const active = reminders.filter((r) => r.status !== "dismissed");
  if (active.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-xl)",
        }}
      >
        <p style={{ color: "var(--color-ink-secondary)" }}>
          You haven&apos;t set a reminder yet. Start an episode and press the mic
          button (or R) while you listen.
        </p>
      </div>
    );
  }

  const pending = active.filter((r) => r.status === "pending");
  const fired = active.filter((r) => r.status === "fired");

  return (
    <div className="flex flex-col gap-10">
      {pending.length > 0 ? <Section title="Pending" reminders={pending} /> : null}
      {fired.length > 0 ? <Section title="Fired" reminders={fired} /> : null}
    </div>
  );
}

function Section({
  title,
  reminders,
}: {
  title: string;
  reminders: Doc<"reminders">[];
}) {
  return (
    <section>
      <h2
        className="text-[11px] font-semibold tracking-widest uppercase mb-4"
        style={{ color: "var(--color-ink-muted)" }}
      >
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {reminders.map((r) => (
          <ReminderCard key={r._id} reminder={r} />
        ))}
      </div>
    </section>
  );
}
