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

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2 rounded-md text-[15px] transition-colors",
              active
                ? "text-[var(--color-ink-primary)]"
                : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)]",
            )}
          >
            {active ? (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full"
                style={{ background: "var(--color-accent)" }}
                aria-hidden
              />
            ) : null}
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
