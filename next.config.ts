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
    // Tree-shake the large icon package so the compiler touches fewer modules.
    optimizePackageImports: ["lucide-react"],
  },
  // Build speed: skip the type-check during `next build` locally (we run
  // `npm run typecheck` as a separate gate). On Vercel (VERCEL=1) it still runs,
  // so a type error never reaches a deploy. Next 16 dropped the build-time
  // ESLint integration, so there is no lint step to toggle here.
  typescript: { ignoreBuildErrors: !process.env.VERCEL },
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
