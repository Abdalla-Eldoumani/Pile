"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { Play, Calendar, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { buildIcs } from "@/lib/calendar/ics";

export function ReminderCard({ reminder }: { reminder: Doc<"reminders"> }) {
  const dismiss = useMutation(api.reminders.dismiss);

  function downloadIcs() {
    let ics: string;
    try {
      ics = buildIcs(
        {
          id: reminder._id,
          userId: reminder.userId,
          scheduledFor: reminder.scheduledFor,
          label: reminder.label,
          episodeId: reminder.episodeId,
          audioAnchorMs: reminder.audioAnchorMs,
          lineId: reminder.lineId,
          chunkId: reminder.chunkId,
          chunkExcerpt: reminder.chunkExcerpt,
          status: reminder.status,
          createdAt: reminder.createdAt,
        },
        { baseUrl: window.location.origin },
      );
    } catch {
      return;
    }
    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "pile-reminder.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="p-6"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-mono)" }}
          >
            {formatWhen(reminder.scheduledFor)}
          </div>
          <h3
            className="text-[18px] font-semibold leading-snug"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {reminder.label}
          </h3>
        </div>
        <button
          onClick={() => void dismiss({ reminderId: reminder._id })}
          aria-label="Dismiss reminder"
          className="shrink-0 p-1.5 rounded-md"
          style={{ color: "var(--color-ink-muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      {reminder.chunkExcerpt ? (
        <p
          className="mt-4 text-[14px] leading-relaxed line-clamp-3 pl-3"
          style={{
            color: "var(--color-ink-secondary)",
            borderLeft: "3px solid var(--color-accent)",
          }}
        >
          {reminder.itemTitle ? (
            <span style={{ color: "var(--color-ink-muted)" }}>
              {reminder.itemTitle}:{" "}
            </span>
          ) : null}
          {reminder.chunkExcerpt}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/episode/${reminder.episodeId}?t=${reminder.audioAnchorMs}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-medium transition-all hover:brightness-110"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Play size={15} /> Play from this moment
        </Link>
        <button
          onClick={downloadIcs}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[14px] transition-colors"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-ink-primary)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <Calendar size={15} /> Add to calendar
        </button>
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
