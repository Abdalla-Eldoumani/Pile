# Pile

**The pile you saved. Finally heard.**

Built at the Cursor Calgary Hackathon, SAIT, May 23 to 24, 2026.

## What this is

Everyone has a saved-and-forgotten pile. Articles you bookmarked, PDFs you downloaded, YouTube talks you queued. The signal is real; the activation energy to read it is too high.

Pile turns that pile into a 5 to 8 minute conversation between two AI hosts who actually disagree. They cover three pieces, debate one, and recommend the one worth reading in full. You listen on a walk, on a commute, while doing dishes.

That alone would be NotebookLM-with-better-taste. The thing that makes Pile different is **temporal anchoring**.

## Temporal anchoring

While you're listening, you can hit a mic button and say "remind me Sunday at 7 PM to review the part about attention sinks."

Pile knows three things at that instant:

1. The audio second you paused at
2. The dialogue line being spoken at that second
3. The exact source paragraph that line was citing

So when Sunday at 7 PM arrives, you open the reminder and see the paragraph quoted, the line of dialogue that triggered the memory, and a button to resume the audio from that exact second.

We build this at generation time, not at playback time. Every dialogue line is produced through Anthropic's structured tool use API with a mandatory citation field; ElevenLabs returns per-character timestamps; the lookup `audioMs -> lineId -> chunkId` is a table, not a search.

## Status

The core loop runs end to end: add a URL or PDF, generate, and a two-host conversation
renders to a stitched MP3 where every substantive line is anchored to its source
paragraph, with a player that syncs the waveform, the now-playing line, and the source
excerpt as each citation plays. Audio is verified on the ElevenLabs Starter plan.

Built: auth, content extraction (URL, PDF, YouTube), chunking, the Claude citation
pipeline, the audio render pipeline, the add / generate UI, the episode player, and the
voice-reminder feature, so the full temporal-anchoring loop runs end to end. Next: demo
prep and deploy. The team handoff is in [`docs/STATUS.md`](./docs/STATUS.md).

## Demo

Runs locally today (see Setup). Not yet deployed: the public URL and the walkthrough
video go here at submission.

## How it works (technical)

```
Add to Pile  ->  Extract text  ->  Chunk with stable IDs
                                              |
                                              v
                                Claude generates dialogue
                                with per-line tool-use citations
                                              |
                                              v
                                ElevenLabs renders each line
                                with character-level timestamps
                                              |
                                              v
                                Stitch audio + build lookup:
                                audioMs -> lineId -> chunkId
                                              |
                                              v
                                Player + voice reminder feature
                                using the lookup as the temporal anchor
```

## Stack

- **Frontend**: Next.js 16.2 App Router, React 19, TypeScript 5.6, Tailwind v4
- **Backend**: Convex 1.39 (database + scheduler + file storage + reactive queries, one service)
- **Auth**: Clerk 7 via the first-party Clerk + Convex JWT bridge
- **Script generation**: Anthropic Claude Opus 4.7 with structured tool use
- **TTS**: ElevenLabs (eleven_flash_v2_5 with character timestamps)
- **PDF**: pdfjs-dist (client-side extraction)
- **URLs**: Jina Reader (server-side Markdown extraction)
- **Voice input**: Web Speech API (free, on-device, instant), Groq Whisper as fallback
- **NL date parsing**: chrono-node
- **Calendar**: .ics file export (Google Calendar import works in one click)
- **Deploy**: Vercel

Exact pinned versions in [`package.json`](./package.json). Every version was verified against npm on May 23, 2026.

## Setup

The full setup walkthrough lives in [`docs/SETUP.md`](./docs/SETUP.md). It covers account creation, Convex + Clerk wiring, API keys, deployment, and common errors.

Short version:

```bash
npm install
npx convex dev                     # one terminal
# put your Clerk keys in .env.local (docs/SETUP.md step 3)
npx convex env set CLERK_JWT_ISSUER_DOMAIN "..."
npx convex env set ANTHROPIC_API_KEY "sk-ant-..."
npx convex env set ELEVENLABS_API_KEY "..."
npm run dev                        # second terminal
npm test                           # optional: unit tests for the core logic
```

Accounts needed: Anthropic (~$5 of credit), ElevenLabs (free tier or ~$5), Clerk (free), Convex (free), Vercel (free).

## Design

Editorial dark. Single warm-gold accent. Fraunces variable serif (italic speaker names, a nod to opera librettos) paired with General Sans. No drop shadows; depth comes from borders and spacing. No purples, no teals, no cyans. Tailwind v4 with the design tokens declared in `src/app/globals.css`.

## Team

Abdalla ElDoumani
Seyar Hazrat
Ahmed Ibrahim
Ibrahim Ahmed

## License

MIT.
