// The Pile: add items and see everything saved. Implements T8.1 + T8.2.

import { PileGrid } from "@/components/library/PileGrid";

export default function LibraryPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <header className="mb-10">
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
      </header>
      <PileGrid />
    </div>
  );
}
