import { httpRouter } from "convex/server";

/**
 * HTTP router for Convex endpoints (webhooks, etc.).
 *
 * Add a Clerk webhook here later for user.deleted -> cascade cleanup.
 * Document path: /clerk-webhook. Use svix to verify the signature.
 *
 * No endpoints are mounted yet.
 */

const http = httpRouter();

export default http;
