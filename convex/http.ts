import { httpRouter } from "convex/server";

/**
 * HTTP router for Convex endpoints (webhooks, etc.).
 *
 * Add a Clerk webhook here later for user.deleted -> cascade cleanup.
 * Document path: /clerk-webhook. Use svix to verify the signature.
 *
 * Empty at scaffold time; mount real endpoints during the build.
 */

const http = httpRouter();

export default http;
