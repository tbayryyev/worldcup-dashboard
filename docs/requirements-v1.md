# World Cup 2026 Live Dashboard — v1 Requirements

*Document version: 1.0 — May 2026*
*Owner: Project lead*

## 1. Overview

A public web dashboard that lets any visitor see what's happening at the FIFA World Cup 2026 — live scores during matches, group standings, the full tournament fixture list, top-performer statistics, and detailed per-match views. Built end-to-end on a **$0 budget** using free tiers and public data sources.

### Goal
Deliver a usable, near-real-time World Cup dashboard accessible at a public URL, with live data lagging real-world events by no more than ~2 minutes.

### Audience
Public — anyone visiting the URL. No login, no account, no personalisation in v1.

### Constraint
Total infrastructure cost across the project lifetime must remain **$0**. No paid APIs, no paid hosting, no paid orchestration tools.

## 2. Scope

### In scope (v1 — what ships before tournament kickoff)
- Live scores and in-play status for currently-playing matches.
- Group standings for the group stage.
- Full fixture list for all 104 tournament matches.
- Top-performer statistics: goalscorers, assists, key individual stats.
- Match detail page accessible by clicking any match card.

### Out of scope (deferred to v2 or later)
- User accounts, sign-in, favourites, comments, predictions.
- Push notifications.
- Match highlights (video).
- Tactical analysis panels (shot maps, heatmaps, xG).
- Multi-language support (English only in v1).
- Native mobile apps.
- Historical World Cup data (only 2026 in v1).
- Editorial content (articles, recaps).

## 3. Information architecture

```
/                         Home — today's / upcoming matches
/standings                Group stage tables
/fixtures                 All 104 matches in the tournament
/stats                    Top scorers, assists, other individual leaders
/match/[id]               Detailed view of a single match
```

Top-level navigation is a tab bar containing **Home, Standings, Fixtures, Stats**. The match detail page is reached only by clicking a match card from any other page.

## 4. Functional requirements — page by page

### 4.1 Home (`/`)

**Purpose:** the default landing experience — show what's relevant *right now*.

**Behaviour:**
- If there are matches scheduled for today (server-side date, but display in the user's local timezone), show them.
- If there are no matches today, show the next day with scheduled matches.
- Each match is represented as a card. Cards are grouped/ordered by kickoff time.

**Each match card displays:**
- Home team name + crest.
- Away team name + crest.
- Either the score (if live or finished) or the kickoff time in the user's local timezone (if upcoming).
- Status badge: *upcoming* / *live (current minute)* / *half time* / *full time*.
- For live matches: a visual indicator that updates without a page reload.

**Interaction:**
- Clicking anywhere on a card navigates to `/match/[id]`.

### 4.2 Standings (`/standings`)

**Purpose:** show the state of the group stage.

**Behaviour:**
- Display all 12 groups (World Cup 2026 has 48 teams in 12 groups of 4).
- For each group, show a table with columns: Team, Played, Won, Drawn, Lost, Goals For, Goals Against, Goal Difference, Points.
- Highlight qualification status: top 2 of each group auto-qualify; the best 8 of 12 third-placed teams also advance to the round of 32.
- Tables update live during ongoing group-stage matches.

**Notes:**
- Outside the group-stage window (i.e. once knockouts have begun), this page can be hidden or replaced with a knockout-bracket view (v2 candidate).

### 4.3 Fixtures (`/fixtures`)

**Purpose:** the full schedule.

**Behaviour:**
- Show all 104 tournament matches.
- Default grouping: by matchday / by stage (group stage matchday 1 → 2 → 3 → R32 → R16 → QF → SF → 3rd place → Final).
- Each row displays: date, kickoff time (user's local TZ), team A vs team B, final score (if completed) or status (if upcoming/live), venue, stage.
- Clicking a row navigates to `/match/[id]`.

**Filters (basic, v1):**
- By team (dropdown of all 48 participating teams).
- By group (dropdown of 12 groups + knockout rounds).
- By date (date picker).

### 4.4 Stats (`/stats`)

**Purpose:** tournament-wide individual leaders.

**Behaviour — three sections on one page:**

1. **Top goalscorers** — table of top 10 players by goals, columns: rank, player, team/country, goals, matches played, minutes per goal.
2. **Top assisters** — table of top 10 players by assists, same column shape.
3. **Other leaders** (single combined panel or three sub-panels): yellow cards leader, red cards leader, clean sheets leader (goalkeepers).

**Notes:**
- Lists update as matches complete.
- See *risks* below — this section depends on either ESPN exposing leader endpoints for the tournament or on aggregating the data ourselves from per-match results.

### 4.5 Match detail (`/match/[id]`)

**Purpose:** everything about one match.

**Sections, top to bottom:**

1. **Match header**
   - Date, kickoff time (user's local TZ), venue, stage (e.g. "Group A — Matchday 2" or "Round of 16").
   - Both teams' crests and names, current score (large), current status (live minute / FT / scheduled).

2. **Goal timeline**
   - Chronological list of goals: minute, scorer, assist (if any), goal type (regular / penalty / own goal / header / etc.).

3. **Lineups**
   - Starting XI for each team, with formation (e.g. 4-3-3).
   - Substitutions made: minute, player on, player off.

4. **In-game stats**
   - Side-by-side comparison: possession %, total shots, shots on target, corners, fouls, yellow cards, red cards, offsides, passes (if available), pass accuracy (if available).

5. **Match events**
   - Combined chronological feed: goals, cards, substitutions in match-minute order.

6. **External link**
   - "Watch highlights on ESPN" or similar — links out to ESPN's own match page.

## 5. Data requirements

### 5.1 Live data
- **Source:** ESPN public Site API, endpoint `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`.
- **Polling cadence:** 30 seconds (server-side); browser refetches the proxied endpoint at 15–30 second intervals.
- **Freshness target:** within ~2 minutes of real-world events (empirically validated in [analyze_espn_lag.ipynb](analyze_espn_lag.ipynb)).

### 5.2 Match detail data
- **Source:** ESPN public Site API, endpoint `summary?event={id}`.
- **Polling cadence:** on demand (when a user opens a match detail page), with a brief client-side cache.

### 5.3 Standings data
- **Source:** ESPN public Site API, endpoint `standings/total`.
- **Polling cadence:** every 5 minutes during the group stage; static after group stage ends.

### 5.4 Static fixture data
- **Source:** `https://github.com/openfootball/worldcup.json/blob/master/2026/worldcup.json` (community-maintained, open source).
- **Cadence:** loaded at frontend build time. Refreshed by re-deploying when the schedule is updated by openfootball.

### 5.5 Historical match data
- **Source:** ESPN's `summary?event={id}` for completed matches (immutable once final).
- **Storage:** snapshotted into a static `history.json` regenerated every 1–2 hours by a GitHub Actions cron job and served via Cloudflare Pages.

## 6. Non-functional requirements

| Requirement | Target |
|---|---|
| Initial page load (cold) | < 2 seconds on a typical broadband connection |
| Live data refresh on the open page | every 15–30 seconds, without full page reload |
| Lag from real-world event to dashboard display | ≤ 2 minutes (best effort) |
| Mobile support | responsive layout from 360 px width upwards |
| Browser support | latest two versions of Chrome, Safari, Firefox, Edge |
| Public accessibility | no login, no rate-limited paywall, anonymous browsing |
| Total monthly infrastructure cost | $0 |
| Hosting | Cloudflare Pages (frontend) + Cloudflare Workers via Pages Functions (live API proxy) |
| Time zone handling | all timestamps rendered in the user's local timezone, with date labels based on the same |

## 7. Risks and open questions

| Risk | Severity | Mitigation |
|---|---|---|
| ESPN's public API is undocumented and unsupported; the endpoint or schema could change. | Medium | Wrap all ESPN calls in a thin adapter layer; schema-validate responses; have a degraded-mode fallback that serves the last successful payload from cache. |
| ESPN may not expose a single endpoint for tournament leaders (top scorers, assisters). | Medium | Plan B: aggregate from per-match results ourselves. Plan C: use Sofascore's tournament endpoint as a fallback (with the TOS caveat documented separately). |
| Cloudflare Pages free tier limits builds to 500/month — hourly history-regeneration cron may push close. | Low | Drop cron frequency to every 2 hours, or write `history.json` to Cloudflare R2 instead of the Git repo so it doesn't trigger a build. |
| Single-region edge cache means users in different geographies may see slightly different scores for ~30 seconds. | Low | Acceptable for v1. |
| ESPN may begin rate-limiting if dashboard traffic spikes. | Low | Already mitigated by server-side cache: ESPN gets hit ~2 times per minute per region regardless of user count. |
| Top-performer data shape for the tournament not yet confirmed in ESPN's API. | Open | Investigate before locking the `/stats` page design. May need a one-line PR to update if format differs from expectations. |

## 8. Acceptance criteria

v1 is considered complete when **all** of the following are true:

1. Dashboard is deployed at a public URL (`*.pages.dev` or a custom domain).
2. The five pages — Home, Standings, Fixtures, Stats, Match Detail — are all reachable and functional.
3. During a real live match, the live score on the Home page updates without a page reload within 30 seconds of the upstream ESPN payload changing.
4. Group standings on `/standings` match the data ESPN displays on their own site at the same point in time, up to live-feed lag.
5. Match detail page renders lineups, scorers, and in-game stats for a completed match.
6. The dashboard renders correctly on a mobile device (iOS Safari + Android Chrome).
7. Total monthly infrastructure cost is $0.
8. The codebase is in a public GitHub repo with a working CI/CD pipeline (auto-deploy on push to `main`).

## 9. References

- Data source decision and lag measurements: [findings.md](findings.md)
- Detailed lag analysis notebooks: [analyze_lag.ipynb](analyze_lag.ipynb), [analyze_espn_lag.ipynb](analyze_espn_lag.ipynb)
- ESPN public API community docs: <https://github.com/pseudo-r/Public-ESPN-API>
- Static fixture data: <https://github.com/openfootball/worldcup.json>
