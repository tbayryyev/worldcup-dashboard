# Video 3 — Build Notes: Deploy + Storage Decision and Setup

*Script-aide for the YouTube episode covering hosting + storage for the World Cup 2026 dashboard. Companion to [`deploy-storage-decision.md`](deploy-storage-decision.md), which contains the deep reasoning. This doc is the chronological story arc — what happened, what surprised us, and what to show on camera.*

## Starting state (before this session)

The repo directory existed locally but had **no code yet** — just three planning Markdown files:

```
worldcup-dashboard/
├── dashboard-CLAUDE.md   ← project context, still named with prefix
├── findings.md           ← API evaluation (video 1/2 material)
└── requirements-v1.md    ← v1 spec
```

No Next.js scaffold, no `package.json`, no `git init`, and — found out the hard way — **no Node.js installed on the Mac**.

The user had already created the empty GitHub repo at `https://github.com/tbayryyev/worldcup-dashboard` and tried to run:

```bash
git remote add origin https://github.com/tbayryyev/worldcup-dashboard.git
git branch -M main
git push -u origin main
```

…which would have failed anyway because there was nothing to push and no `.git` folder.

**Show on camera:** the empty-ish directory + the GitHub repo's "create a new repository on the command line" instructions. Then explain what's missing: scaffold first, then init+push.

## Scene 1 — Dev environment: turns out the Mac has no Node

Trying `npx create-next-app` failed: `npx: command not found`. Checked Homebrew, MacPorts, nvm — none installed. Fresh-Mac problem.

Three options were on the table:
1. **nvm** — small, no sudo, per-project version switching. **Chosen.**
2. **Homebrew + node** — heavier install but unlocks other CLI tools later.
3. **Node `.pkg` from nodejs.org** — GUI install, no terminal config.

Installed nvm via the official curl script, then `nvm install --lts` → Node v24.16.0.

> **Footgun:** each `Bash` tool call starts a fresh shell, so `nvm` sourcing from `.bashrc` doesn't persist. Worked around by prepending `~/.nvm/versions/node/v24.16.0/bin` to `PATH` explicitly in each subsequent command.

**Show on camera:** the "npx: command not found" error → the install command → `node --version` working. Quick beat about why nvm beats Homebrew for JS work (version switching per project).

## Scene 2 — Scaffolding Next.js without losing the planning docs

Ran:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
```

**Footgun #2:** create-next-app refuses to scaffold into a non-empty directory if any of the existing files conflict. It complained about `CLAUDE.md`.

Solution: temporarily moved `CLAUDE.md` and `docs/` to `/tmp`, ran the scaffold, moved them back. Next.js's create-next-app **also auto-ran `git init`** and made an initial commit (`56540a0 Initial commit from Create Next App`) — saved us a step.

Then installed `@tanstack/react-query` and committed (`fb3b7ec`).

**Show on camera:** the "conflicts with files" error, the move-aside trick, and the surprise that Next.js does `git init` for you. Optional beat: why we chose `--src-dir` and the `@/*` alias.

## Scene 3 — First push to GitHub

```bash
git remote add origin https://github.com/tbayryyev/worldcup-dashboard.git
git branch -M main
git push -u origin main
```

Worked first try. Repo now has the Next.js scaffold + project context + planning docs.

**Show on camera:** the GitHub repo refreshing to show files. Quick beat about what `-u origin main` means (set upstream tracking).

## Scene 4 — The deploy/storage decision (this is the meat of video 3)

**Decision documented in detail in [`deploy-storage-decision.md`](deploy-storage-decision.md).** Video-3 talking points:

### Hosting: Vercel vs Cloudflare

Compared:
- **Vercel Hobby** — best Next.js DX (Vercel built Next.js), but: 100 GB bandwidth/month cap, soft cap on function invocations, and the **commercial-use clause** is a real issue for a YouTube-channel-promoted dashboard.
- **Cloudflare Workers** — unlimited free bandwidth, 100k requests/day, no commercial-use restriction, but: needs an adapter (`@opennextjs/cloudflare`) to run Next.js.
- **Netlify / GitHub Pages / Render / Fly.io** — looked at briefly, rejected (similar Vercel-style caps or can't host the API route).

Chose Cloudflare for the bandwidth ceiling and the commercial-use clause. The tradeoff: weaker DX, weaker logs.

### Storage: why no database

Three workload buckets in this project:
1. **Live scores** — lifetime: seconds. Storage = 30s edge cache. The cache *is* the database.
2. **Static fixtures** — known at build time. Bundle them.
3. **History** — small, append-only, ~500 KB total over the whole tournament. A `history.json` regenerated every ~2h by GitHub Actions cron, committed to the repo, served by the CDN.

A database (Supabase, Neon, Cloudflare D1, KV…) would add: schema, migrations, an account with a payment method, connection pooling concerns, a new secret. None of which v1 needs.

**Show on camera:** the comparison table, then the architecture diagram (Cloudflare Workers + GitHub Actions cron, no DB). Big "lol no Postgres" moment.

### Commits documenting this decision

- `b59429a` Document deploy + storage decision (Cloudflare Pages, no DB) — *original write-up assumed Pages flow.*
- `9c304b5` Update docs to reflect Cloudflare Workers (not Pages) — *updated after we discovered the Workers flow is now recommended.*

## Scene 5 — Wait, Cloudflare has TWO ways to host Next.js?

This was the surprise that drives a lot of video 3.

I was about to install `@cloudflare/next-on-pages` (the Pages adapter) when the user pointed out the Cloudflare UI was showing **`npx wrangler deploy`** as the deploy command, not anything Pages-related. That's a Workers thing.

Turns out Cloudflare has two paths:

| | Pages flow (older) | Workers flow (newer) |
|---|---|---|
| Adapter | `@cloudflare/next-on-pages` | `@opennextjs/cloudflare` |
| Status | **Deprecated** (warns on install) | Current recommendation |
| Deploy | Auto on `git push` | `npx wrangler deploy` |
| Config in repo | None (CF dashboard only) | `wrangler.jsonc` + `open-next.config.ts` |

Cloudflare's UI unified "Workers & Pages" into one section, so it's easy to miss which flow you're on. The new "Import a repository" flow defaults to **Workers** for Next.js projects.

**Show on camera:** the CF UI with the deploy command field, point at "this is the Workers flow." Briefly mention the Pages flow as legacy. Acknowledge the comparison doc had to be updated.

## Scene 6 — The "let me just try it" moment

User stopped me mid-install ("maybe I can try deploying right now see if it works?") — turned out to be the right call. The first deploy succeeded **without us installing anything locally**:

What happened in that first build (`worldcup-dashboard.production.37406b6e...`):
1. CF UI build command (still set to old `@cloudflare/next-on-pages`) ran. Built `.vercel/output/`.
2. CF UI deploy command `npx wrangler deploy` ran.
3. Wrangler detected: "this is a Next.js project with no `wrangler.jsonc`" → triggered **`@opennextjs/cloudflare migrate` automatically on Cloudflare's build machine**.
4. Migration created `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars`, `public/_headers`, modified `package.json` and `next.config.ts`.
5. Re-built with the OpenNext adapter, deployed.

Site went live at https://worldcup-dashboard.mrtahyr.workers.dev. Blank Next.js page loaded fine.

**The footgun in the last log line:**
> *"Detected wrangler autoconfig generated changes to your project. Please run 'npx wrangler setup' in your repo and commit the changes."*

Cloudflare made all those config changes **on the build machine only**. The repo had no idea. Every future deploy would redo the migration from scratch (~30s wasted each time, plus you can't customize the config).

**Show on camera:** the first build log, point at the migration step. Then point at the warning at the end. This is a great "gotcha" moment — most tutorials don't mention it because they assume you commit `wrangler.jsonc` from the start.

## Scene 7 — Mirroring the auto-migration locally

Ran:
```bash
npx wrangler@4 setup
```

It tried to OAuth-login to Cloudflare (browser flow) and timed out in the non-interactive shell, but the local file-generation step still completed. Generated:

- `wrangler.jsonc` — worker name, compat date, `nodejs_compat` flag, assets binding, observability flag.
- `open-next.config.ts` — minimal default; R2 caching commented out (note for v2).
- `public/_headers` — long cache TTL for `/_next/static/*` immutable assets.
- `next.config.ts` patch — `initOpenNextCloudflareForDev()` so `next dev` works locally.
- `package.json` scripts — `deploy`, `preview`, `upload`, `cf-typegen`.
- `.gitignore` — ignore `.open-next`, `.wrangler`, `.dev.vars`.

Committed as `136a886 Configure Cloudflare Workers deploy via OpenNext adapter` and pushed.

**Show on camera:** the git diff for this commit. Especially highlight the package.json scripts — they're how you'd run a deploy locally.

## Scene 8 — Second deploy: half-broken (build/deploy mismatch)

After pushing the config, the next CF build (`cc36a547...`) **failed**:

```
Build command (still set to OLD): npx @cloudflare/next-on-pages@1   → output: .vercel/output/
Deploy command:                   npx wrangler deploy
                                  ↓ detects OpenNext config we just committed
                                  ↓ calls opennextjs-cloudflare deploy
                                  ↓ looks for .open-next/worker.js → NOT FOUND
ERROR: Could not find compiled Open Next config, did you run the build command?
```

Two different adapters producing two different output paths. The build step was making `.vercel/output/`, the deploy step was looking for `.open-next/`.

Fix: change CF UI build command from `npx @cloudflare/next-on-pages@1` → `npx opennextjs-cloudflare build`.

**Show on camera:** this error message and the diagnosis. It's a clean illustration of "different adapters, different outputs, must match."

## Scene 9 — Third deploy: clean (~80s total)

After the build-command fix (`de5ebf30...`):

```
Build:  npx opennextjs-cloudflare build  → produces .open-next/worker.js ✅
Deploy: npx wrangler deploy              → uploads 1 changed asset (BUILD_ID) ✅
Total time: ~80s (down from ~3min on the auto-migrate deploy)
```

Worker live at the same URL. Version ID `91bdc27f-68b6-48d4-9745-b7e566622fff`. Page loads.

**Show on camera:** the success log, then the live site. Compare build time vs the first one (auto-migrate added a minute+).

## Final state at end of this session

**Repo:** https://github.com/tbayryyev/worldcup-dashboard, branch `main`, 5 commits.

```
9c304b5  Update docs to reflect Cloudflare Workers (not Pages)
136a886  Configure Cloudflare Workers deploy via OpenNext adapter
b59429a  Document deploy + storage decision (Cloudflare Pages, no DB)
fb3b7ec  Add project context, planning docs, and TanStack Query
56540a0  Initial commit from Create Next App
```

**Live site:** https://worldcup-dashboard.mrtahyr.workers.dev — blank Next.js scaffold.

**Cloudflare deploy pipeline:**
- Build: `npx opennextjs-cloudflare build`
- Deploy: `npx wrangler deploy`
- Trigger: git push to `main`
- Time: ~80s

**Stack confirmed:**
- Next.js 16.2.6 (App Router) + TypeScript + Tailwind + TanStack Query
- Deployed to Cloudflare Workers via `@opennextjs/cloudflare` adapter
- Config in `wrangler.jsonc` and `open-next.config.ts`
- No database

## Things worth showing on camera (highlight reel)

1. **The fresh-Mac moment** — `npx: command not found`, then the install. Sets up "we're starting from zero."
2. **The decision matrix** for hosting (Vercel vs Cloudflare vs others). Show the table, walk through one row at a time.
3. **The commercial-use clause** in Vercel's terms — this is the most-overlooked Hobby-tier limit.
4. **The "Cloudflare has two flows" reveal** — show the deprecation warning when `@cloudflare/next-on-pages` installs.
5. **The auto-migrate footgun** — show the build log warning line, then explain why it matters.
6. **The build/deploy mismatch error** — clean illustration of an adapter contract.
7. **The successful 80s deploy** — payoff. Live URL working.
8. **The "no database" architecture diagram** — Cloudflare Workers + GitHub Actions cron + static `history.json`. Audience won't expect this to work; it does.

## What's NOT in this session (for context — coming in later videos)

- `/api/live` — ESPN proxy with 30s edge cache (next thing to build).
- The Home page + `MatchCard` component.
- The `/standings`, `/fixtures`, `/match/[id]`, `/stats` routes.
- GitHub Actions cron for `history.json`.
- The actual tournament traffic test (when matches start).
