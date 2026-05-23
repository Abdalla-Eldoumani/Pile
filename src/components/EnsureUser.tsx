"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Mirrors the Clerk user into the Convex `users` table once per session.
 *
 * Gated on Convex's auth state, not Clerk's: ensureUser calls
 * ctx.auth.getUserIdentity(), and that identity only exists after the Clerk
 * JWT has reached the Convex client. Gating on Clerk's isSignedIn would fire
 * the mutation before Convex can authenticate it. Renders nothing.
 */
export function EnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(api.users.ensureUser);
  const ran = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || ran.current) return;
    ran.current = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    void ensureUser({ timezone });
  }, [isAuthenticated, ensureUser]);

  return null;
}
