"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Play, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Today", icon: Play },
  { href: "/library", label: "Library", icon: Library },
  { href: "/reminders", label: "Reminders", icon: Bell },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: "var(--color-surface-1)",
        borderTop: "1px solid var(--color-border-subtle)",
      }}
    >
      <ul className="flex h-16 items-center justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 text-[11px] font-medium tracking-wide uppercase",
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-ink-muted)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
