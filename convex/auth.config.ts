/**
 * Clerk + Convex auth bridge.
 *
 * The JWT template MUST be named "convex" in the Clerk dashboard.
 * See PRE_FLIGHT.md step 4.5 for the setup.
 *
 * CLERK_JWT_ISSUER_DOMAIN is set via `npx convex env set ...` (PRE_FLIGHT step 5).
 */

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
