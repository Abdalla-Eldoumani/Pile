import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to the project dir. A stray package-lock.json in the
  // home directory otherwise makes Turbopack infer the wrong root, which also
  // skews the production build's file tracing. dev/build run from the project
  // root, so process.cwd() is that dir (and always a defined string).
  turbopack: {
    root: process.cwd(),
  },
  // pdfjs-dist ships a worker; we let Next bundle it via dynamic import.
  // If "Module not found: pdfjs-dist/legacy/build/pdf" surfaces, add
  // a copy step to public/ and reference /pdf.worker.min.mjs explicitly.
  experimental: {
    // Next.js 16 stable surface; flip toggles here if needed.
  },
  // Security headers. Project-level; Vercel adds its own on top.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self)",
          },
        ],
      },
    ];
  },
  // Convex storage and Clerk image hosts.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
};

export default nextConfig;
