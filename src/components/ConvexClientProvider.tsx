"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Convex client bound to Clerk auth.
 *
 * Pattern: <ClerkProvider> wraps the whole app at the root (in app/layout.tsx).
 * This component sits INSIDE ClerkProvider and threads Clerk's useAuth into
 * ConvexProviderWithClerk. Do not wrap ClerkProvider again here.
 *
 * Canonical pattern: https://docs.convex.dev/auth/clerk
 */

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
  { unsavedChangesWarning: false },
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
