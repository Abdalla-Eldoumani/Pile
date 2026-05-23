import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileNav } from "@/components/MobileNav";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-[240px] shrink-0 px-4 py-6"
        style={{ borderRight: "1px solid var(--color-border-subtle)" }}
      >
        <Link
          href="/"
          className="font-display italic text-2xl tracking-tight mb-8 px-2"
          style={{ fontVariationSettings: '"opsz" 96, "wght" 400' }}
        >
          Pile
        </Link>
        <SidebarNav />
        <div className="mt-auto px-2 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-32 md:pb-32">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
