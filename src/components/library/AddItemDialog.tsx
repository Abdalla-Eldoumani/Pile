"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { Link2, FileText, Play, X, Loader2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import { extractPdfText } from "@/lib/extraction/pdf";

type Tab = "url" | "pdf" | "youtube";

const TABS = [
  { id: "url" as const, label: "Link", Icon: Link2 },
  { id: "pdf" as const, label: "PDF", Icon: FileText },
  { id: "youtube" as const, label: "YouTube", Icon: Play },
];

export function AddItemDialog({ onClose }: { onClose: () => void }) {
  const addItem = useAction(api.items.addItem);
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytTranscript, setYtTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await work();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    void run(() => addItem({ kind: "url", url: trimmed }));
  };

  const addPdf = (file: File) => {
    void run(async () => {
      const { text, pages } = await extractPdfText(file);
      await addItem({
        kind: "pdf",
        text,
        pages,
        title: file.name.replace(/\.pdf$/i, ""),
      });
    });
  };

  const addYoutube = () => {
    if (!ytUrl.trim()) return;
    void run(() =>
      addItem({
        kind: "youtube",
        url: ytUrl.trim(),
        ...(ytTranscript.trim() ? { text: ytTranscript.trim() } : {}),
        ...(ytTitle.trim() ? { title: ytTitle.trim() } : {}),
      }),
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] p-6"
        style={{
          background: "rgba(27,27,32,0.98)",
          backdropFilter: "blur(24px)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--color-ink-muted)" }}
          >
            Add to Pile
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md transition-colors"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 mb-5">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setError(null);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[14px] transition-colors"
              style={{
                background: tab === id ? "var(--color-surface-3)" : "transparent",
                color:
                  tab === id
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-muted)",
              }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "url" ? (
          <div className="flex flex-col gap-3">
            <label
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-ink-muted)" }}
            >
              Article URL
            </label>
            <input
              type="url"
              value={url}
              autoFocus
              placeholder="https://..."
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
              disabled={busy}
              className="h-11 px-4 rounded-md text-[15px] outline-none"
              style={{
                background: "var(--color-surface-3)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-ink-primary)",
              }}
            />
            <PrimaryButton onClick={addUrl} busy={busy} label="Add link" />
          </div>
        ) : tab === "pdf" ? (
          <div className="flex flex-col gap-3">
            <label
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-ink-muted)" }}
            >
              PDF file
            </label>
            <input
              type="file"
              accept="application/pdf"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addPdf(f);
              }}
              className="text-[14px]"
              style={{ color: "var(--color-ink-secondary)" }}
            />
            {busy ? (
              <div
                className="flex items-center gap-2 text-[13px]"
                style={{ color: "var(--color-ink-muted)" }}
              >
                <Loader2 size={14} className="animate-spin" /> Reading PDF...
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-ink-muted)" }}
            >
              YouTube link
            </label>
            <input
              type="url"
              value={ytUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) => setYtUrl(e.target.value)}
              disabled={busy}
              className="h-11 px-4 rounded-md text-[15px] outline-none"
              style={{
                background: "var(--color-surface-3)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-ink-primary)",
              }}
            />
            <input
              type="text"
              value={ytTitle}
              placeholder="Title (optional)"
              onChange={(e) => setYtTitle(e.target.value)}
              disabled={busy}
              className="h-11 px-4 rounded-md text-[15px] outline-none"
              style={{
                background: "var(--color-surface-3)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-ink-primary)",
              }}
            />
            <textarea
              value={ytTranscript}
              rows={4}
              placeholder="Paste the transcript here (auto-fetch is unavailable)"
              onChange={(e) => setYtTranscript(e.target.value)}
              disabled={busy}
              className="p-3 rounded-md text-[14px] outline-none resize-none"
              style={{
                background: "var(--color-surface-3)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-ink-primary)",
              }}
            />
            <PrimaryButton onClick={addYoutube} busy={busy} label="Add video" />
          </div>
        )}

        {error ? (
          <p className="mt-4 text-[13px]" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  busy,
  label,
}: {
  onClick: () => void;
  busy: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="h-10 px-5 rounded-md text-[14px] font-medium transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-60"
      style={{
        background: "var(--color-accent)",
        color: "var(--color-bg)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : null}
      {busy ? "Adding..." : label}
    </button>
  );
}
