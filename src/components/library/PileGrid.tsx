"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Link2, FileText, Play, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { AddItemDialog } from "./AddItemDialog";

const KIND_ICON: Record<Doc<"items">["kind"], LucideIcon> = {
  url: Link2,
  pdf: FileText,
  youtube: Play,
};

export function PileGrid() {
  const items = useQuery(api.items.list);
  const remove = useMutation(api.items.remove);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-8 flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-[14px] font-medium transition-all hover:brightness-110"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Plus size={16} /> Add to Pile
        </button>
      </div>

      {items === undefined ? (
        <p className="text-[14px]" style={{ color: "var(--color-ink-muted)" }}>
          Loading your Pile...
        </p>
      ) : items.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <div
                key={item._id}
                className="group relative p-6 transition-colors"
                style={{
                  background: "var(--color-surface-1)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <Icon size={20} style={{ color: "var(--color-ink-muted)" }} />
                <h3
                  className="mt-4 text-[18px] font-semibold leading-snug line-clamp-3"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  {item.title}
                </h3>
                <div
                  className="mt-3 text-[12px]"
                  style={{
                    color: "var(--color-ink-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {new Date(item.addedAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => void remove({ itemId: item._id })}
                  aria-label="Remove from Pile"
                  className="absolute top-4 right-4 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {open ? <AddItemDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="rounded-xl p-12 text-center"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-xl)",
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
      <p className="max-w-md mx-auto mb-8" style={{ color: "var(--color-ink-secondary)" }}>
        Paste a link to your first article or drop a PDF. Add two or more and
        Pile can turn them into a conversation.
      </p>
      <button
        onClick={onAdd}
        className="px-5 py-2.5 rounded-md text-[14px] font-medium transition-all hover:brightness-110"
        style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
      >
        Paste a link
      </button>
    </div>
  );
}
