import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="text-[11px] font-semibold tracking-widest uppercase mb-5"
        style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-mono)" }}
      >
        Error 404
      </div>
      <h1
        className="font-display tracking-tight max-w-[680px]"
        style={{
          fontSize: "clamp(40px, 7vw, 72px)",
          lineHeight: 1.05,
          fontVariationSettings: '"opsz" 144, "wght" 320',
          color: "var(--color-ink-primary)",
        }}
      >
        This page is not in the{" "}
        <span
          className="italic"
          style={{ fontVariationSettings: '"opsz" 144, "wght" 320, "SOFT" 100' }}
        >
          pile.
        </span>
      </h1>
      <p
        className="mt-6 max-w-[460px] text-[17px] leading-relaxed"
        style={{ color: "var(--color-ink-secondary)" }}
      >
        The link may be broken, or the page may have moved. What you saved is
        still waiting where you left it.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-md font-medium text-[15px] transition-all hover:brightness-110"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Back home
        </Link>
        <Link
          href="/library"
          className="px-6 py-3 rounded-md text-[15px] transition-colors hover:bg-surface-2"
          style={{
            border: "1px solid var(--color-border-subtle)",
            color: "var(--color-ink-primary)",
          }}
        >
          Open your Pile
        </Link>
      </div>
    </main>
  );
}
