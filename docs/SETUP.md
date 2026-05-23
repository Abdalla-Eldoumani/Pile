# Pile: Setup Guide

What to do, in order, to get a working local copy of Pile. Written for someone who has not used Convex, Clerk, or ElevenLabs before.

Expected time: 20 to 30 minutes if no account exists for any of the services; 10 to 15 minutes if you have accounts already.

This guide does not assume any particular AI build tool. Use Cursor, Claude Code, Continue, Aider, Cline, plain VS Code with Copilot, or no AI at all. The setup is the same; only the editor in front of you differs.

## What you need before starting

Accounts at the following services. All free tiers are sufficient for the hackathon. Sign up for what you do not already have before going further.

1. **GitHub**: for the repo
2. **Convex**: backend (database, scheduler, file storage). https://convex.dev
3. **Clerk**: auth. https://clerk.com
4. **Anthropic**: script generation. https://console.anthropic.com (load $5 to $10 of credit; the build uses roughly $2)
5. **ElevenLabs**: TTS. https://elevenlabs.io (free tier gives ~10,000 characters which is about one episode; load $5 to be safe)
6. **Vercel**: deploy (only needed at hour 22). https://vercel.com

On your machine you need:

- **Node.js 20+** (`node -v` should print v20 or higher)
- **npm 10+** (ships with Node 20)
- **Git** (`git --version`)

Optional but useful:

- **Vercel CLI**: `npm i -g vercel`
- **The `gh` GitHub CLI** if you like creating repos from the terminal

## 1. Clone and install

```bash
unzip pile-scaffold.zip -d pile
cd pile
git init
git add .
git commit -m "initial scaffold"
```

Make the private agent infrastructure invisible to git (the `.agent/` folder, every `CLAUDE.md`, `.claude/skills/`, `.claude/agents/`, `.planning/`):

```bash
cat .git-exclude-template >> .git/info/exclude
rm .git-exclude-template
```

Verify the exclude is working. This must print a line confirming the match:

```bash
git check-ignore -v .agent/PRD.md
# expected: .git/info/exclude:N:.agent/    .agent/PRD.md
```

Install dependencies. Expect this to take ~3 minutes:

```bash
npm install
```

If you see peer-dependency warnings about React 19, ignore them.

## 2. Convex

Convex is the backend: database, scheduler, file storage, and reactive query engine. One service, no SQL.

### 2.1 Create the project

In your project directory:

```bash
npx convex dev
```

The CLI will walk you through:

- Press Enter to log in (opens a browser; sign in with GitHub)
- Choose **Create a new project**
- Project name: `pile` (or anything you like)
- Deployment: pick **Development** (the default)

When the prompts finish, the CLI starts watching your `convex/` folder and writes `NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud` into `.env.local` automatically.

**Leave this terminal running** for the rest of the hackathon. It hot-reloads your Convex functions every time you save a file in `convex/`.

### 2.2 Verify

In a second terminal:

```bash
ls -la .env.local
```

You should see the file with `NEXT_PUBLIC_CONVEX_URL` set. If not, the `convex dev` step did not finish; go back and watch for errors.

## 3. Clerk

Clerk handles every sign-in / sign-up screen so you do not have to build them.

### 3.1 Create the application

1. Go to **https://dashboard.clerk.com** and sign in
2. Click **Create application**
3. Name it `Pile`
4. Pick the sign-in methods you want enabled. Recommended for the hackathon: **Email** and **Google**
5. Click **Create application**

### 3.2 Copy the API keys

On the application's home screen, Clerk shows the two keys you need. They begin with `pk_test_...` and `sk_test_...`.

Open `.env.local` in your editor and add (or fill in the placeholder lines that came with the scaffold):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/library
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/library
```

### 3.3 Set up the JWT template (the Convex bridge)

This is the part everyone forgets. Without it, signed-in users in Clerk look unauthenticated to Convex.

1. In the Clerk dashboard left sidebar, go to **Configure** → **Sessions** → **JWT Templates** (also reachable under **Session management → JWT Templates** in older layouts)
2. Click **New template**
3. From the preset list, click **Convex**. This creates a template **named exactly `convex`** (lowercase). Do not rename it.
4. The template editor shows an **Issuer URL** at the top. It looks like `https://<your-clerk-app>.clerk.accounts.dev`. Copy it.
5. Click **Save**

### 3.4 Hand Clerk's issuer URL to Convex

Convex needs to know which JWTs to trust. Set this as a Convex environment variable (note: NOT in `.env.local`, but in Convex's own env):

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://<your-clerk-app>.clerk.accounts.dev"
```

Substitute the actual URL from step 3.3.4.

Verify:

```bash
npx convex env list
```

You should see `CLERK_JWT_ISSUER_DOMAIN` in the output.

The file `convex/auth.config.ts` in the scaffold already references this env var and registers `applicationID: "convex"`, matching the JWT template name from step 3.3.3.

## 4. Anthropic

For script generation (Claude Opus 4.7) and reminder label refinement (Claude Sonnet).

### 4.1 Get the key

1. Go to https://console.anthropic.com and sign in
2. Sidebar → **API Keys** → **Create Key**
3. Name it `pile-hackathon`
4. Copy the key (starts with `sk-ant-...`); it is shown once
5. Optional but recommended: go to **Plans & billing** → **Auto-reload** and load $10 of credit so you do not run out mid-episode

### 4.2 Hand it to Convex

```bash
npx convex env set ANTHROPIC_API_KEY "sk-ant-..."
```

## 5. ElevenLabs

For the two AI host voices. You can defer voice selection to later (the scaffold's TTS module will pick voices once you set the env vars). What you need at setup time is the API key.

### 5.1 Get the key

1. Go to https://elevenlabs.io and sign in
2. In the left sidebar, click your profile icon at the bottom → **Profile + API key** (or top-level **Developers** → **API Keys** depending on dashboard layout)
3. Click **Create Key**
4. Name it `pile-hackathon`
5. Under permissions, enable **Text to Speech**, set **Voices** and **User** to **Read**. Leave other options default.
6. Click **Create Key**
7. Copy immediately (shown once)

### 5.2 Hand it to Convex

```bash
npx convex env set ELEVENLABS_API_KEY "..."
```

### 5.3 Voice IDs (defer this step)

You will need two voice IDs (Vega and Theo). These can be picked later once the audio pipeline is being built. When you are ready:

1. Browse https://elevenlabs.io/app/voice-library
2. Open a voice you like. Look at the URL: the long string after `/voice-library/` is the voice id. Copy it.
3. Pick a different voice for Theo. Copy that id too.
4. Set both as Convex env vars:
   ```bash
   npx convex env set ELEVENLABS_VEGA_VOICE_ID "..."
   npx convex env set ELEVENLABS_THEO_VOICE_ID "..."
   ```

For a starting point, well-known public voices:

- Vega (curious, warm, female-voiced): try `Rachel`, `Bella`, or `Aria`
- Theo (direct, lower-register, male-voiced): try `Adam` or `Daniel`

You can change these later; rendering an episode does not memoize the voice id.

## 6. Optional: Upstash Redis for URL rate limiting

The scaffold's URL extraction uses Jina Reader (free, rate-limited). If you want to protect against a burst of paste-URL spam during the demo, set up Upstash Redis:

1. Sign up at https://console.upstash.com (free)
2. Create a Redis database (any region near you)
3. From the database page, copy **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**
4. Set both as Convex env vars:
   ```bash
   npx convex env set UPSTASH_REDIS_REST_URL "..."
   npx convex env set UPSTASH_REDIS_REST_TOKEN "..."
   ```

Skip this step if you are short on time. The scaffold treats the rate limiter as optional.

## 7. Run locally and verify

In one terminal (keep `npx convex dev` running here):

```bash
npx convex dev
```

In a second terminal:

```bash
npm run dev
```

Open http://localhost:3000. You should see the landing page.

### 7.1 Verify Clerk works

Click **Sign in**. The Clerk modal opens. Sign up with a test email. After verification, you land on `/library`.

If the modal does not open: check that the keys in `.env.local` are correct, restart the dev server, and reload the page.

### 7.2 Verify the Clerk-Convex bridge works

This is the critical handoff. Open the browser devtools (F12) → **Network** tab. Refresh `/library`. You should see network requests to your Convex deployment URL (`.convex.cloud`).

If you see Convex requests returning `401 Unauthorized`, the JWT template is not set up correctly:

- The template name must be **exactly** `convex` (lowercase, no spaces)
- The Issuer URL in Convex env must match the one shown in the Clerk JWT template
- After fixing, restart `npx convex dev` so it picks up the new env var

A quick programmatic check (only after the agent has implemented users.me in Phase 1):

```javascript
// In a client component:
const me = useQuery(api.users.me);
console.log(me);  // should be a user document, not null
```

## 8. Deploy to Vercel (skip until hour 22)

When you are ready to deploy:

```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

In the Vercel project's **Settings → Environment Variables**, mirror these:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, etc.

The Convex-side env vars (`ANTHROPIC_API_KEY`, `ELEVENLABS_*`, `CLERK_JWT_ISSUER_DOMAIN`) stay in Convex; Vercel does not need them.

For production, you also need to flip the Convex deployment from `Development` to `Production`:

```bash
npx convex deploy
```

This builds your Convex backend for the production deployment and writes the production URL. Update `NEXT_PUBLIC_CONVEX_URL` in Vercel to that production URL.

## Troubleshooting

### `npx convex dev` hangs on first run

Kill it (Ctrl+C) and run again. If it still hangs, delete the local Convex auth and retry:

```bash
rm -rf ~/.convex
npx convex dev
```

### `Cannot find module './_generated/server'` in convex/ files

The Convex CLI generates types on first sync. If you opened a `.ts` file in `convex/` before `npx convex dev` finished its first run, your editor's TypeScript server may have cached the missing-module error. Restart `npx convex dev`, then in VS Code: **Cmd/Ctrl + Shift + P → TypeScript: Restart TS Server**.

### Sign-in succeeds but Convex queries return null

The JWT template is misconfigured. Verify:

1. Template is named `convex` (case-sensitive)
2. `CLERK_JWT_ISSUER_DOMAIN` is set in Convex env (via `npx convex env list`)
3. The two values agree
4. `npx convex dev` was restarted after setting the env var

### `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required` at runtime

Your `.env.local` does not have the key, OR the dev server was started before the key was added. Restart `npm run dev` after every change to `.env.local`.

### ElevenLabs returns 401 on TTS calls

The API key does not have **Text to Speech** permission. Go back to the dashboard, edit the key (or create a new one), and explicitly enable the Text to Speech scope.

### `Module not found: pdfjs-dist/legacy/build/pdf`

pdfjs-dist import paths are quirky. The scaffold imports it as `'pdfjs-dist'` and sets the worker via dynamic copy. If you see this error, ensure the worker file ships from `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`. The agent will handle this in Phase 3.

### A different teammate cloned and `.agent/` is missing

That is correct. `.agent/` is excluded from the public repo via `.git/info/exclude` and never committed. Each teammate gets a fresh copy by re-extracting the zip on their machine and re-running:

```bash
cat .git-exclude-template >> .git/info/exclude
rm .git-exclude-template
```

If the original zip is not on their machine, share the contents of `.agent/` via DM or USB; never commit them.

## When you are done

Open `.agent/STARTING_PROMPT.md` and paste it into your AI coding tool. The agent will read the docs, confirm pre-flight is complete, and pick the next task off `TASKS.md`.

If you are not using an AI tool: read `.agent/PRD.md`, `.agent/ARCHITECTURE.md`, and `.agent/TASKS.md` in that order, then start on Phase 1.
