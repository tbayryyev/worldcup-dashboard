# Findings — Free Live Data Sources for a World Cup 2026 Dashboard

*Project: live World Cup 2026 dashboard. Constraint: $0 total budget.*
*Methodology and supporting notebooks: [`analyze_lag.ipynb`](analyze_lag.ipynb), [`analyze_espn_lag.ipynb`](analyze_espn_lag.ipynb).*

## Executive summary

Eight football APIs were evaluated against four criteria — free tier exists, FIFA World Cup 2026 covered, supports live data, and rate limit sufficient for a multi-match live polling workload. Five were rejected at the documentation stage. Three free tiers were tested empirically: [football-data.org](https://www.football-data.org/pricing), [API-Football](https://www.api-football.com/documentation-v3), and [SoccerDataAPI](https://soccerdataapi.com/docs/). football-data.org was tested most extensively because its 10 req/min budget was the only one that could sustain a continuous live poller; under empirical measurement during Serie A matchday 38 on May 24, 2026, its free tier was confirmed to lag real-world goals and in-play status changes by approximately **6 minutes**.

That failure forced a wider search, which landed on **ESPN's undocumented public Site API**. Empirical measurement during 6 Norwegian Eliteserien matches on May 25, 2026 — cross-referenced against FotMob push notifications as ground truth — showed ESPN delivers in-play status changes, goals, and full-time updates within **~1–2 minutes** of real time, uniformly across event types, with no asymmetry. ESPN is the chosen primary live feed. Sofascore's undocumented API is used selectively for post-match depth. `openfootball/worldcup.json` provides static fixture data.

## Decision matrix

| API | Free tier | World Cup 2026 | Live | Rate limit | Measured lag | Chosen |
|---|---|---|---|---|---|---|
| Sportradar | ❌ enterprise | ✅ | ✅ | n/a | n/a | ❌ |
| sportsdata.io | ⚠️ trial only | ✅ | ✅ | trial | n/a | ❌ |
| Sportmonks | ⚠️ free tier limited | ✅ (paid) | ✅ (paid) | n/a | n/a | ❌ |
| RapidAPI Free Live Football Data | ✅ | ✅ | ✅ | very tight | n/a | ❌ |
| wc2026api.com | unclear | unclear | unclear | unclear | n/a | ❌ |
| football-data.org | ✅ | ✅ | ⚠️ delayed | 10/min | **~6 min** | ❌ |
| API-Football | ✅ | ✅ | ✅ | 100/day | not benchmarked (cap too low) | ❌ |
| SoccerDataAPI | ✅ | ✅ | ✅ | 75/day | not benchmarked (cap too low) | ❌ |
| **ESPN public Site API** | ✅ | ✅ | ✅ | empirical (no documented cap) | **~1–2 min** | ✅ |

## APIs evaluated

### Rejected at the documentation stage

**Sportradar** — Industry-standard data provider, used by major sportsbooks. Enterprise-only pricing, no usable free tier. Pricing not visible without a sales conversation. Reference: [`https://developer.sportradar.com/soccer/docs/soccer-ig-data-coverage-tiers`](https://developer.sportradar.com/soccer/docs/soccer-ig-data-coverage-tiers).

**sportsdata.io** — Free *trial*, not a free tier. After trial expiration, paid plans only. Not viable for the 40+ day World Cup window. Reference: [`https://sportsdata.io/developers#free-trial`](https://sportsdata.io/developers#free-trial).

**Sportmonks** — High-quality data, well-documented. The free tier excludes live World Cup data; live plans start at meaningful monthly cost. Reference: [`https://www.sportmonks.com/football-api/plans-pricing/`](https://www.sportmonks.com/football-api/plans-pricing/).

**RapidAPI — Free API Live Football Data** — Per-minute rate limits on the free tier are too tight to cover a single 90-minute window with multiple concurrent matches. Reference: [`https://rapidapi.com/Creativesdev/api/free-api-live-football-data/pricing`](https://rapidapi.com/Creativesdev/api/free-api-live-football-data/pricing).

**wc2026api.com** — Looked promising on paper (purpose-built for the World Cup). The website doesn't function reliably; signup flow does not complete; appears semi-abandoned. Reference: [`https://www.wc2026api.com/`](https://www.wc2026api.com/).

### Tested candidates

**football-data.org (free tier).** 10 requests per minute, generous enough to sustain continuous live polling at a 30s cadence (only 2/min used, 8/min headroom). World Cup coverage present. The pricing page states that scores in the free tier are not real-time but does not specify the delay magnitude. Empirical measurement (see methodology below) put the delay at **~6 minutes** for goals and in-play status changes. The only event that surfaces in real time on the free tier is the initial `TIMED → IN_PLAY` (kickoff) transition. Data is score + status only — no scorer names, no event detail, no lineups. Reference: [`https://www.football-data.org/pricing`](https://www.football-data.org/pricing).

**API-Football (RapidAPI).** 100 requests per day on the free tier. Rich data — goal events with scorer, lineups, statistics, fixtures, head-to-head. The hard daily cap is the disqualifier: it cannot sustain continuous polling, and at the World Cup group-stage peak with multiple simultaneous matches, even reactive lookups would burn the budget within hours. Reference: [`https://www.api-football.com/documentation-v3`](https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures-rounds).

**SoccerDataAPI.** 75 requests per day on the free tier. Similar data shape and similar limitation to API-Football. Reference: [`https://soccerdataapi.com/docs/`](https://soccerdataapi.com/docs/).

**ESPN public Site API.** Undocumented, unofficial, no auth, no developer signup. Base URL: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/{action}`. Endpoints used in testing:

- `scoreboard` — all matches for a league/day, with live scores and goal events (`competitions[0].details`).
- `summary?event={id}` — full match detail, including starting lineups + formations.

No published rate limit. Empirical observation places the soft limit somewhere around 1 request per second per IP. World Cup 2026 covered under league slug `fifa.world`. References: [`https://github.com/pseudo-r/Public-ESPN-API`](https://github.com/pseudo-r/Public-ESPN-API), [`https://zuplo.com/learning-center/espn-hidden-api-guide`](https://zuplo.com/learning-center/espn-hidden-api-guide). Lineup endpoint example: [`https://site.api.espn.com/apis/site/v2/sports/soccer/nor.1/summary?event=401843354`](https://site.api.espn.com/apis/site/v2/sports/soccer/nor.1/summary?event=401843354).

## Methodology — football-data.org test (Serie A matchday 38)

[`capture_serie_a.py`](capture_serie_a.py) polled `https://api.football-data.org/v4/competitions/SA/matches?matchday=38` every 30 seconds during the final-matchday Sunday late slot (May 24, 2026, 18:45 UTC kickoff scheduled). All 258 raw responses were saved to [`serie-a-matchday-38/`](serie-a-matchday-38/) and a per-event change log was produced.

Establishing the true real-world event time was non-trivial. Match minutes are clock readings, not wall-clock times. Three sources were combined to derive ground truth:

1. **Scheduled kickoff** from the football-data.org `utcDate` field and the Sportmonks post-match dataset ([`serie_a_data.json`](serie_a_data.json)).
2. **Post-match event minutes** for each goal, from Sportmonks.
3. **Independent real-world timestamps** for selected events: Milan vs Cagliari's real kickoff at 20:52 CEST (the match started ~7 min late — confirmed by reporting at [sempremilan.com](https://sempremilan.com/ac-milan-1-2-cagliari-match-report)); Verona vs Roma's 56' goal (4:11 PM EDT), 90+3' goal (4:47 PM EDT), and full-time whistle (4:50 PM EDT).

The Verona ground truth in particular allowed direct end-to-end lag measurement for both 2H goals and full-time, eliminating reliance on a 15-min half-time assumption (which turned out to be wrong — actual half-time on this final matchday was ~21 minutes, inflated by championship-day ceremonies). The full methodology and the four iterations of analysis are documented in [`analyze_lag.ipynb`](analyze_lag.ipynb).

## Methodology — ESPN test (Norwegian Eliteserien)

[`capture_espn.py`](capture_espn.py) polled `https://site.api.espn.com/apis/site/v2/sports/soccer/nor.1/scoreboard` every 30 seconds during the Sunday round of Norwegian Eliteserien matches (May 25, 2026). All 327 raw responses were saved to [`espn-nor-1-20260525/`](espn-nor-1-20260525/) and two change logs were produced (the poller was restarted between the early matches and the late kickoff).

Ground truth came from **FotMob iOS push notifications**, captured as phone screenshots in [`norway_league_real_times/`](norway_league_real_times/). FotMob is reputed (and informally verified against TV broadcast) to surface in-play events within ~5–30 seconds of real time. Each notification carries a backend-issued timestamp visible on the phone. Six matches contributed 17 in-play events with cross-referenced timestamps. Per-event matching and lag computation are in [`analyze_espn_lag.ipynb`](analyze_espn_lag.ipynb).

## Lag results — full numbers

### football-data.org — per-event lag (final, after ground-truth correction)

| Event type | Lag |
|---|---|
| Initial kickoff (`TIMED → IN_PLAY`) | ~15s (real-time, within polling jitter) |
| 1H goals | ~6 min |
| Half-time pause (`IN_PLAY → PAUSED`) | ~5m 30s |
| 2nd-half restart (`PAUSED → IN_PLAY`) | ~6 min |
| 2H goals | ~6 min |
| Full-time (`IN_PLAY → FINISHED`) | ~6m 30s |

12 goals analysed; corrected goal lag converged on median **6m 04s**, range **5m 18s – 8m 45s**.

### ESPN — per-event lag (vs FotMob ground truth)

| Event | n | min | median | mean | max |
|---|---|---|---|---|---|
| Half-time pause | 4 | 64s | 82s | 80s | 95s |
| 2nd-half restart | 5 | 54s | 101s | 87s | 105s |
| Goal | 5 | 38s | 110s | 96s | 128s |
| Full-time | 3 | 26s | 82s | 64s | 83s |
| **All in-play** | **17** | **26s** | **89s** | **84s** | **128s** |

### Caveats applying to both measurements

- 30-second polling cadence introduces 0–30s of unavoidable detection jitter for every event.
- FotMob, used as the ground truth for the ESPN test, has its own ~5–30s upstream lag. True ESPN-vs-reality lag may therefore be ~10–30s smaller than the figures above.
- Match minutes are integer-precision; sub-minute uncertainty per event is unavoidable without a finer-grained event timestamp from the upstream feed.
- Both tests are single-matchday samples. ESPN's pipeline may behave differently for top-tier competitions during the World Cup itself — see *open questions* below.

## Architecture decision

**Primary live feed:** ESPN public Site API.

- Poll `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard` every 30 seconds.
- One request returns all live World Cup matches for the day; filter `competitions[0].status.type.state == "in"`.
- On detected score/event change, call `summary?event={id}` once for richer detail.
- Pre-match: poll `summary?event={id}` for lineups once they're confirmed (~40–60 min before kickoff per empirical observation).

**Post-match enrichment:** Sofascore's undocumented API, used **on demand**, not as a polling feed.

- `https://api.sofascore.com/api/v1/event/{id}/incidents` — full goal build-up with field coordinates, pass networks, shot data, body part, goalkeeper position. ESPN doesn't expose any of this.
- Hit only when a user opens a match-detail page or after FT for highlight cards.
- Estimated load: 5–20 calls per matchday total, well below any plausible rate-limit threshold.

**Static fixture data:** `https://github.com/openfootball/worldcup.json/blob/master/2026/worldcup.json` — community-maintained, open source, no API call needed. Used for fixture list, group structure, venues.

**Polling pattern:** single backend poller per league per 30s interval. All dashboard clients read from a server-side cache (in-memory / Redis / SQLite — implementation detail for the next video). One upstream request per 30s irrespective of dashboard user count.

## Risks and limitations

**ESPN has no SLA.** The endpoints are undocumented and could change schema, rename, or disappear without notice. Mitigation: wrap all ESPN calls in a thin adapter layer so a schema break is localised to one file. Plan B: cached `openfootball` + a hard fallback to a sparse data mode if the primary feed dies during a match.

**Rate limits are empirical, not contractual.** Sustained 1 req/s seems comfortable; bursts of 10+ rps risk Cloudflare throttling. The 30s polling cadence is well within the safe envelope, but ESPN could clamp without warning.

**Terms of service are grey.** Sofascore's TOS explicitly forbids automated access; ESPN's site API has no published terms specifically for the JSON endpoints but is technically the same domain that serves their consumer site. For a personal/educational dashboard, enforcement risk is low. For commercial scale or a high-visibility public site, this would need a legal review.

**Single-matchday samples.** Both lag measurements come from one day each, one league each. The Norwegian Eliteserien isn't necessarily representative of how fast ESPN's pipeline runs for the World Cup, which is presumably a higher priority for their data ops team. Worth re-benchmarking once the tournament starts.

**Asymmetry not fully ruled out for ESPN.** Goal lag in the data is slightly higher (median 110s) than other event types (82–101s). The sample is small (n=5); could be coincidence or could indicate a real ~20-second extra delay on goal updates. Worth more data.

## Open questions / future work

- **Re-benchmark ESPN on the actual World Cup.** Run `capture_espn.py` on `fifa.world` during the opening matchday. Compare lag numbers to the Norwegian Eliteserien baseline.
- **Quantify FotMob's upstream lag directly.** A handful of TV-timestamped events would let us subtract FotMob's own delay and report true ESPN-vs-reality lag rather than ESPN-vs-FotMob.
- **Knockout-round backup.** Consider a single low-cost paid tier (e.g. football-data.org's ~€15/mo, or Sportmonks low tier) reserved exclusively for the knockout rounds as a parallel feed for redundancy. Not in current budget but worth pricing.
- **Sofascore TOS risk re-evaluation.** If the dashboard's scope grows beyond personal, the Sofascore depth panels should either be fronted by a paid alternative (Opta/Stats Perform via aggregator) or built more conservatively from ESPN-only data.
- **Player photos and metadata.** ESPN provides headshots via athlete IDs. Worth caching these locally during the pre-tournament window to avoid hot-loading them during match broadcasts.

## Source links

- football-data.org pricing — [`https://www.football-data.org/pricing`](https://www.football-data.org/pricing)
- API-Football documentation — [`https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures-rounds`](https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures-rounds)
- SoccerDataAPI documentation — [`https://soccerdataapi.com/docs/`](https://soccerdataapi.com/docs/)
- Sportradar coverage tiers — [`https://developer.sportradar.com/soccer/docs/soccer-ig-data-coverage-tiers`](https://developer.sportradar.com/soccer/docs/soccer-ig-data-coverage-tiers)
- sportsdata.io free trial — [`https://sportsdata.io/developers#free-trial`](https://sportsdata.io/developers#free-trial)
- Sportmonks pricing — [`https://www.sportmonks.com/football-api/plans-pricing/`](https://www.sportmonks.com/football-api/plans-pricing/)
- RapidAPI Free Live Football Data — [`https://rapidapi.com/Creativesdev/api/free-api-live-football-data/pricing`](https://rapidapi.com/Creativesdev/api/free-api-live-football-data/pricing)
- wc2026api.com — [`https://www.wc2026api.com/`](https://www.wc2026api.com/)
- ESPN unofficial API (community docs) — [`https://github.com/pseudo-r/Public-ESPN-API`](https://github.com/pseudo-r/Public-ESPN-API)
- Zuplo ESPN hidden API guide — [`https://zuplo.com/learning-center/espn-hidden-api-guide`](https://zuplo.com/learning-center/espn-hidden-api-guide)
- ESPN lineups endpoint (example) — [`https://site.api.espn.com/apis/site/v2/sports/soccer/nor.1/summary?event=401843354`](https://site.api.espn.com/apis/site/v2/sports/soccer/nor.1/summary?event=401843354)
- Sofascore unofficial API (example) — [`https://api.sofascore.com/api/v1/event/14023963/incidents`](https://api.sofascore.com/api/v1/event/14023963/incidents)
- Sofascore community Python wrapper — [`https://github.com/apdmatos/sofascore-api`](https://github.com/apdmatos/sofascore-api)
- Open Football static World Cup fixtures — [`https://github.com/openfootball/worldcup.json/blob/master/2026/worldcup.json`](https://github.com/openfootball/worldcup.json/blob/master/2026/worldcup.json)
- Milan vs Cagliari match report (Milan kicked off at 20:52 CEST) — [`https://sempremilan.com/ac-milan-1-2-cagliari-match-report`](https://sempremilan.com/ac-milan-1-2-cagliari-match-report)
