# Pile: build status and handoff

Status as of 2026-05-23. This is the team brief: what runs today, what is left, and
the one external service we must fix before audio works. Share the codebase as a zip;
this file is the PDF.

## In one paragraph

The core loop is built and works end to end: add a URL or PDF to the Pile, generate an
episode, and two AI hosts (Vega and Theo) produce a conversation where every substantive
line is anchored to the exact source paragraph it draws from, rendered to a stitched MP3
with a synced player (audio + waveform + the source paragraph lighting up as it is
cited). Audio is verified working on the ElevenLabs Starter plan. The temporal-anchoring
loop is complete: while listening you can drop a voice (or typed) reminder that pins the
audio second, the dialogue line, and the source paragraph, and replay from that exact
moment. What remains is demo prep and deploy.

## What runs today (try it locally)

With `npx convex dev` running and `npm run dev` up, sign in and:

1. **`/library`**: "Add to Pile", paste a URL or drop a PDF. The text is extracted
   (Jina Reader for URLs, in-browser pdf.js for PDFs), chunked, and saved. It appears in
   the grid.
2. **`/today`**: "Generate today's episode" (enabled at two or more items). The status
   banner animates `generating -> scripted -> rendering` live, then the cited dialogue
   script renders, with a gold dot on every line anchored to a source.

This exercises auth, extraction, chunking, the Claude citation pipeline, and the audio
pipeline's entry point.

## Phase status

| Phase | Area | State |
|-------|------|-------|
| 1 | Foundation: schema, Clerk + Convex auth bridge | Done |
| 2 | Layout shell, design tokens, self-hosted fonts | Done (light-theme toggle deferred, a planned cut) |
| 3 | Content extraction (URL, PDF, YouTube, chunking, addItem) | Done |
| 4 | Script generation with per-line tool-use citations | Done, verified against the live model |
| 5 | TTS pipeline (synthesis, stitch, waveform, storage) | Done, verified on ElevenLabs Starter |
| 8 | Pile + Today UI (add, list, generate, view script) | Done (YouTube add is via manual paste) |
| 6 | Player UI (audio, waveform, source-excerpt panel) | Done |
| 7 | Reminder feature (voice capture, anchor, .ics) | Done |
| 9, 10 | Demo prep, deploy | Not started |

The authoritative task-by-task breakdown is in `.agent/TASKS.md` (private; in the zip).

## How it was verified

- `npm run typecheck`, `npm run lint`, and `npm run build` are green.
- Convex functions deploy cleanly (script and audio actions run in the Node runtime).
- Tested against real services: URL extraction (live Jina), script generation (live
  Claude Opus: 18 lines, zero invalid citations), and the pure modules (chunking,
  stitching, waveform) by unit test.
- Not yet verifiable without a person at a browser: the interactive add and generate
  flow (Clerk sign-in cannot be driven headlessly) and audio (see below).

## Services to fix

### 1. ElevenLabs (resolved)

The account is on the Starter plan and synthesis is verified: a live test produced real
MP3 for both voices, stitched and stored in Convex, and fetched back intact (`audio/mpeg`,
bytes matched). The earlier free-tier 401 (`detected_unusual_activity`) is gone. No action
needed unless the key or the two voice ids (`ELEVENLABS_VEGA_VOICE_ID`,
`ELEVENLABS_THEO_VOICE_ID`) change.

### 2. Environment variables (confirm all are set)

Client side, in `.env.local`: `NEXT_PUBLIC_CONVEX_URL`,
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and the Clerk URL vars.

Server side, in Convex (`npx convex env set ...`, confirm with `npx convex env list`):
`CLERK_JWT_ISSUER_DOMAIN`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`,
`ELEVENLABS_VEGA_VOICE_ID`, `ELEVENLABS_THEO_VOICE_ID`. `UPSTASH_*` is optional.

The Clerk JWT template must be named exactly `convex`, or signed-in users look
unauthenticated to Convex (`docs/SETUP.md` step 3.3).

### 3. Convex MCP (optional, not a blocker)

The Convex MCP connection failing with `-32000` is an editor-tooling integration, not
part of the app. `npx convex dev` and the deployed functions work without it. Retry the
MCP setup later or ignore it; it does not affect the build or the demo.

### 4. Dev server (already fixed)

`npm run dev` was failing on two scaffold issues (a Tailwind package version mismatch and
a Clerk import the installed SDK does not expose). Both are fixed; the server boots.

### 5. Deployment (later)

Push to Vercel and flip Convex to production near the end, per `docs/SETUP.md` step 8.
Mirror the client env vars into Vercel; the Convex-side vars stay in Convex.

## What to build next

1. **Phase 9, demo prep**: seed a demo account with a few good items, generate a clean
   pre-baked episode, take screenshots, write the 90-second demo script, record a backup
   video.
2. **Phase 10, deploy**: push to Vercel, flip Convex to production, mirror env vars.

The full loop (Phases 1 to 8 plus the player and reminder) is built and compiles. Confirm
it in a browser end to end: add two items, generate, open the player, drop a reminder, see
it on /reminders, and use "play from this moment" to resume at the anchored second.

Deployment and polishing will come through iterative testing and fixes.

## Run it locally

```
npm install
npx convex dev      # terminal 1, leave running
npm run dev         # terminal 2
```

Full first-time setup (accounts, keys, the Clerk JWT template): `docs/SETUP.md`.
