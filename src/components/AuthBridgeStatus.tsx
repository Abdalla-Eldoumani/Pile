"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Phase 1 verification surface: proves the Clerk -> Convex bridge round-trips.
 * Reads the mirrored user row that EnsureUser writes on sign-in. The episode
 * work (T8.4) replaces this page; this status line goes with it.
 */
export function AuthBridgeStatus() {
  const me = useQuery(api.users.me);
  const label =
    me === undefined
      ? "Connecting to your account..."
      : me === null
        ? "Setting up your account..."
        : `Signed in as ${me.email}`;

  return (
    <p
      className="mt-6 text-[13px]"
      style={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-mono)" }}
    >
      {label}
    </p>
  );
}
