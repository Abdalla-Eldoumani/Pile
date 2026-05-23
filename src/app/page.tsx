import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();
  const signedIn = userId !== null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="font-display italic text-2xl tracking-tight"
          style={{
            fontVariationSettings: '"opsz" 96, "wght" 400',
            color: "var(--color-ink-primary)",
          }}
        >
          Pile
        </Link>
        <div className="flex items-center gap-4">
          {signedIn ? (
            <>
              <Link
                href="/library"
                className="px-4 py-2 text-[15px] rounded-md bg-accent text-bg font-medium hover:brightness-110 transition-all"
                style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
              >
                Open Pile
              </Link>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-[15px] rounded-md hover:bg-surface-2 transition-colors">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="px-6 md:px-10 pt-16 md:pt-32 pb-20 max-w-[1200px] mx-auto">
        <h1
          className="font-display tracking-tight max-w-[920px]"
          style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            lineHeight: 1.04,
            fontVariationSettings: '"opsz" 144, "wght" 320',
            color: "var(--color-ink-primary)",
          }}
        >
          The pile you saved.{" "}
          <span
            className="italic"
            style={{ fontVariationSettings: '"opsz" 144, "wght" 320, "SOFT" 100' }}
          >
            Finally heard.
          </span>
        </h1>

        <p
          className="mt-8 max-w-[640px] text-[19px] leading-relaxed"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Articles you bookmarked. PDFs you downloaded. YouTube talks you queued.
          Pile turns them into a 5 to 8 minute conversation between two AI hosts
          who actually disagree. Pause anytime, say what to remember, and Pile
          pins that moment back to the exact paragraph being discussed.
        </p>

        <div className="mt-12 flex items-center gap-4">
          {signedIn ? (
            <Link
              href="/library"
              className="px-6 py-3 rounded-md font-medium text-[15px] transition-all hover:brightness-110"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-bg)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Open your library
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button
                className="px-6 py-3 rounded-md font-medium text-[15px] transition-all hover:brightness-110"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-bg)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Start your Pile
              </button>
            </SignInButton>
          )}
          <Link
            href="#how"
            className="px-6 py-3 rounded-md text-[15px] hover:bg-surface-2 transition-colors"
            style={{
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-ink-primary)",
            }}
          >
            How it works
          </Link>
        </div>

        {/* The temporal anchoring explainer */}
        <section
          id="how"
          className="mt-32 grid md:grid-cols-3 gap-12"
          style={{ color: "var(--color-ink-primary)" }}
        >
          <div>
            <div
              className="text-[11px] font-semibold tracking-widest uppercase mb-4"
              style={{ color: "var(--color-ink-muted)" }}
            >
              01 · Capture
            </div>
            <h3 className="font-display text-[28px] leading-tight mb-3" style={{ fontVariationSettings: '"opsz" 60, "wght" 380' }}>
              Drop anything into your Pile.
            </h3>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--color-ink-secondary)" }}>
              Paste a URL. Upload a PDF. Drop a YouTube link. Pile extracts the
              text, chunks it, and keeps a stable reference to every paragraph.
            </p>
          </div>

          <div>
            <div
              className="text-[11px] font-semibold tracking-widest uppercase mb-4"
              style={{ color: "var(--color-ink-muted)" }}
            >
              02 · Conversation
            </div>
            <h3 className="font-display text-[28px] leading-tight mb-3" style={{ fontVariationSettings: '"opsz" 60, "wght" 380' }}>
              <span className="italic">Vega</span> and <span className="italic">Theo</span>{" "}
              read it for you.
            </h3>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--color-ink-secondary)" }}>
              Two AI hosts with opinions. They cover three pieces, debate one,
              recommend the one worth reading in full. Every line cites the
              paragraph it came from.
            </p>
          </div>

          <div>
            <div
              className="text-[11px] font-semibold tracking-widest uppercase mb-4"
              style={{ color: "var(--color-accent)" }}
            >
              03 · The wedge
            </div>
            <h3 className="font-display text-[28px] leading-tight mb-3" style={{ fontVariationSettings: '"opsz" 60, "wght" 380' }}>
              Pause. Speak. Anchor a moment.
            </h3>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--color-ink-secondary)" }}>
              Halfway through, say {`"`}remind me Sunday at 7 to review this.{`"`} Pile
              writes a reminder pinned to the audio second, the dialogue line,
              and the source paragraph. When Sunday arrives, you go straight
              back to that moment.
            </p>
          </div>
        </section>
      </main>

      <footer
        className="px-6 md:px-10 py-10 text-[13px]"
        style={{ color: "var(--color-ink-muted)", borderTop: "1px solid var(--color-border-subtle)" }}
      >
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-4 justify-between">
          <span>Built at the Cursor Calgary Hackathon, May 2026.</span>
          <span>Pile is a thinking-person{`'`}s podcast.</span>
        </div>
      </footer>
    </div>
  );
}
