# World Cup 2026 — Live Dashboard

A public, real-time dashboard for the **FIFA World Cup 2026**: live scores, group
standings, full fixtures, a knockout bracket, rich per-match detail (interactive
pitch lineups, tappable player stats, an event timeline, team stats, head-to-head
and live commentary), team profiles, tournament-wide statistics, and a
beginner's guide — built end-to-end on a **$0 hosting budget**.

### ▶︎ Live: **https://worldcup-dashboard.mrtahyr.workers.dev/**

<!-- Tip: drop a couple of screenshots/GIFs in here once captured. -->

---

## Features

| Route | What it does |
| --- | --- |
| `/` | **Home** — today's (or next) matches with auto-refreshing live scores, a "live now" banner, and a tournament-stats teaser (top scorers, most goals, best defense). |
| `/match/[id]` | **Match detail** — scoreline + an interactive **pitch lineup** (tap any player for their match stats), full event timeline (goals **with assists**, cards, subs), team stats (possession, shots, passing…), top performers, venue/referee/attendance, head-to-head and live text commentary. New goals/cards/subs pop up as **live banners** while you watch. |
| `/standings` | **Standings** — all 12 group tables. |
| `/fixtures` | **Fixtures** — the full tournament schedule. |
| `/bracket` | **Bracket** — the knockout bracket, Round of 32 → Final, filling in as teams advance. |
| `/teams` & `/teams/[id]` | **Teams** — every nation with World Cup history (titles, appearances, best finish), FIFA ranking, squad age profile, full squad by position, recent form and next match. **Star** a team to pin it (saved locally). |
| `/stats` | **Stats** — tournament leaderboards: top scorers (with a chart), assisters, team goals (most scored / fewest & most conceded), best passing team, and discipline. |
| `/about` | **About** — a beginner's guide: the new 48-team format, host stadiums, rules in plain English, qualified confederations, past winners and key dates. |

Live data updates within ~30s without a page reload. Links render as rich
**share cards** (Open Graph), and the whole thing is mobile-friendly, dark-themed,
and runs at the edge with **no database**.

---

## Architecture

```
                 ┌───────────────────────────── Cloudflare Workers ──────────────────────────────┐
   Browser  ───▶ │  Next.js app (OpenNext adapter)                                                │
                 │   ├─ /                static assets + client polling                           │
                 │   ├─ /api/live        Worker route → proxies ESPN scoreboard (30s edge cache)   │
                 │   ├─ /api/match/[id]  Worker route → proxies ESPN summary    (30s edge cache)   │
                 │   └─ /stats.json      static asset (precomputed leaderboards)                   │
                 └───────────────────────────────────────────────────────────────────────────────┘
                               │  (all ESPN calls go through one adapter: src/lib/espn.ts)
                               ▼
                        ESPN public Site API  (undocumented, ~1–2 min behind live)

   GitHub Actions (cron, every ~2h) ──▶ aggregates every finished match ──▶ commits public/stats.json ──▶ push triggers Cloudflare deploy
```

**Key decisions** (full rationale in [`docs/`](#documentation))

- **Data source — ESPN public Site API.** Chosen after benchmarking **8 football APIs** ([findings](docs/findings.md)): ESPN's undocumented Site API measured **~1–2 min** behind live — validated against FotMob as ground truth — versus ~6 min for football-data.org's free tier. It has no SLA, so **every ESPN call is wrapped in a single adapter** ([`src/lib/espn.ts`](src/lib/espn.ts)) — a schema break is a one-file fix.
- **No database.** Live data is served through a 30s edge cache (so ESPN is hit ~2×/min per region regardless of traffic); historical/aggregated data is a precomputed static asset. ([why Workers + no DB](docs/deploy-storage-decision.md))
- **Stats are precomputed, not live-aggregated.** ESPN exposes no tournament-leaders endpoint, so leaderboards must be summed from per-match data. Doing that live would blow Cloudflare's free-tier 50-subrequests-per-request cap, so a GitHub Actions cron runs the aggregator and commits [`public/stats.json`](public/stats.json); the push auto-deploys.
- **Dark-only UI** for a consistent look across devices.

---

## Documentation

The engineering decisions behind this project are written up in [`docs/`](docs/):

- **[findings.md](docs/findings.md)** — the data-source evaluation: 8 APIs benchmarked against a $0 live-polling workload, with empirical lag measurements (ESPN ~1–2 min vs football-data.org ~6 min) and the methodology behind them.
- **[deploy-storage-decision.md](docs/deploy-storage-decision.md)** — where to host and what to persist: why Cloudflare Workers (over Vercel) and why there's no database.
- **[requirements-v1.md](docs/requirements-v1.md)** — the v1 product spec: scope, routes, and acceptance criteria.

---

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **TanStack Query** — data fetching & adaptive polling
- **Recharts** — stats charts
- **Cloudflare Workers** via the **OpenNext** adapter (`@opennextjs/cloudflare`)
- **GitHub Actions** — scheduled stats aggregation
- Deployed at the edge; **$0 running cost**

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

### Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build:stats` | Regenerate `public/stats.json` from ESPN (what the cron runs) |
| `npm run deploy` | Build with OpenNext and deploy to Cloudflare |
| `npm run preview` | Build and preview the Workers bundle locally |
| `npm run lint` | ESLint |

### Deployment

Pushing to `main` triggers a Cloudflare build & deploy (Git integration). The
stats workflow ([`.github/workflows/build-stats.yml`](.github/workflows/build-stats.yml))
runs every ~2 hours, regenerates `stats.json`, and commits it — which in turn
redeploys the refreshed asset. You can also trigger it manually from the Actions
tab (**Run workflow**).

---

## Project structure

```
src/
├─ app/                 # routes: home, match/[id], standings, fixtures, bracket,
│                       #         teams (+[id]), stats, about, api/*, icon.svg
├─ components/          # UI — MatchCard, MatchDetailView, LineupPitch,
│                       #      MatchEventToasts, PlayerStatsModal, StatsView,
│                       #      TeamProfileView, TeamsBrowser, FavoriteButton,
│                       #      HomeStats, Nav, …
├─ hooks/               # useScoreboard, useMatchDetail, useStats, useFavorites
├─ lib/
│  ├─ espn.ts           # the ESPN adapter — the only place ESPN shapes are touched
│  ├─ stats.ts          # types for the precomputed stats asset
│  ├─ teamInfo.ts       # curated World Cup history (titles, appearances, best finish)
│  └─ fifaRanking.ts    # FIFA ranking lookup
└─ data/
   └─ fifa-rankings.json # latest FIFA ranking (curated)
scripts/
└─ build-stats.ts       # aggregates finished matches → public/stats.json
```

---

## Data notes & caveats

- **ESPN is undocumented and has no SLA.** Endpoints can change without notice; the adapter isolates that risk.
- **World Cup history and FIFA rankings are curated static data** ([`teamInfo.ts`](src/lib/teamInfo.ts), [`fifa-rankings.json`](src/data/fifa-rankings.json)) — ESPN doesn't expose them. FIFA rankings shift monthly and are refreshed by hand.
- **Stats freshness:** leaderboards refresh on the cron cadence (~2h), so just after a match they can briefly lag the live `/standings` page.
