/**
 * Clerk + Convex auth bridge.
 *
 * The JWT template MUST be named "convex" in the Clerk dashboard.
 * See docs/SETUP.md step 3.3 for the setup.
 *
 * CLERK_JWT_ISSUER_DOMAIN is set via `npx convex env set ...` (docs/SETUP.md
 * step 3.4).
 */

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
