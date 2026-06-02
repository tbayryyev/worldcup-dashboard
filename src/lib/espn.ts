// Thin adapter over ESPN's undocumented public Site API.
// All ESPN calls go through this file so a schema break is a one-file fix.

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

// Standings live under a different base
const ESPN_CORE_BASE =
  "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world";

// Full WC 2026 window is 2026-06-11 to 2026-07-19. ESPN's scoreboard range
// query (?dates=START-END) caps at 100 events per response, so the 104-match
// tournament is split into two windows that fit under it 
const WC2026_RANGE_PART_1 = "20260611-20260710";
const WC2026_RANGE_PART_2 = "20260711-20260719";

// --- Public, normalized shapes (what the rest of the app sees) ---

export type MatchState = "pre" | "in" | "post";

export interface TeamSide {
  id: string;
  name: string;
  abbreviation: string;
  logo: string | null;
  score: number | null;
  homeAway: "home" | "away";
}

export interface GoalEvent {
  clock: string; // "33'"
  teamId: string;
  scorer: string | null;
  type: string; // "Goal - Header"
  penalty: boolean;
  ownGoal: boolean;
}

export interface Match {
  id: string;
  date: string; // ISO
  state: MatchState;
  statusDetail: string; // "Scheduled" / "FT" / "33'"
  clock: string; // displayClock, e.g. "45'"
  home: TeamSide;
  away: TeamSide;
  goals: GoalEvent[];
}

export interface Scoreboard {
  date: string | null;
  matches: Match[];
  fetchedAt: string;
}

export interface LineupPlayer {
  name: string;
  jersey: string;
  position: string;
  starter: boolean;
}

export interface TeamLineup {
  teamId: string;
  homeAway: "home" | "away";
  formation: string | null;
  starters: LineupPlayer[];
  subs: LineupPlayer[];
}

export interface MatchDetail {
  id: string;
  date: string;
  state: MatchState;
  statusDetail: string;
  clock: string;
  home: TeamSide;
  away: TeamSide;
  goals: GoalEvent[];
  lineups: TeamLineup[];
  fetchedAt: string;
}

export interface StandingsEntry {
  team: TeamSide; // homeAway/score are unused here
  rank: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingsGroup {
  id: string;
  name: string; // "Group A"
  entries: StandingsEntry[]; // sorted by rank
}

export interface Standings {
  groups: StandingsGroup[];
  fetchedAt: string;
}

// --- Raw ESPN shapes (only the fields we read; everything is optional
// because the API is undocumented and can omit fields without notice). ---

interface RawTeam {
  id?: string;
  displayName?: string;
  abbreviation?: string;
  logo?: string; // scoreboard endpoint
  logos?: { href?: string }[]; // summary endpoint
}

interface RawCompetitor {
  homeAway?: string;
  score?: string;
  team?: RawTeam;
}

interface RawDetail {
  type?: { text?: string };
  clock?: { displayValue?: string };
  team?: { id?: string };
  scoringPlay?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  athletesInvolved?: { displayName?: string }[];
}

interface RawStatus {
  displayClock?: string;
  type?: { state?: string; description?: string; shortDetail?: string };
}

interface RawCompetition {
  date?: string;
  competitors?: RawCompetitor[];
  details?: RawDetail[];
  status?: RawStatus;
}

interface RawEvent {
  id?: string;
  date?: string;
  status?: RawStatus;
  competitions?: RawCompetition[];
}

interface RawScoreboard {
  day?: { date?: string };
  events?: RawEvent[];
}

interface RawRosterPlayer {
  starter?: boolean;
  jersey?: string;
  athlete?: { displayName?: string };
  position?: { abbreviation?: string };
}

interface RawRoster {
  homeAway?: string;
  formation?: string;
  team?: { id?: string };
  roster?: RawRosterPlayer[];
}

interface RawSummary {
  header?: { competitions?: RawCompetition[] };
  rosters?: RawRoster[];
}

interface RawStat {
  name?: string;
  abbreviation?: string;
  value?: number;
}

interface RawStandingsEntry {
  team?: RawTeam;
  stats?: RawStat[];
}

interface RawStandingsGroup {
  id?: string;
  name?: string;
  abbreviation?: string;
  standings?: { entries?: RawStandingsEntry[] };
}

interface RawStandingsResponse {
  name?: string;
  children?: RawStandingsGroup[];
}

// --- Mapping ---

function normalizeState(state: string | undefined): MatchState {
  if (state === "in") return "in";
  if (state === "post") return "post";
  return "pre";
}

function mapCompetitor(c: RawCompetitor): TeamSide {
  const t = c.team ?? {};
  const rawScore = c.score;
  return {
    id: t.id ?? "",
    name: t.displayName ?? "TBD",
    abbreviation: t.abbreviation ?? "",
    logo: t.logo ?? t.logos?.[0]?.href ?? null,
    score: rawScore != null && rawScore !== "" ? Number(rawScore) : null,
    homeAway: c.homeAway === "away" ? "away" : "home",
  };
}

function mapGoals(details: RawDetail[] | undefined): GoalEvent[] {
  if (!details) return [];
  return details
    .filter((d) => d.scoringPlay)
    .map((d) => ({
      clock: d.clock?.displayValue ?? "",
      teamId: d.team?.id ?? "",
      scorer: d.athletesInvolved?.[0]?.displayName ?? null,
      type: d.type?.text ?? "Goal",
      penalty: d.penaltyKick ?? false,
      ownGoal: d.ownGoal ?? false,
    }));
}

function mapLineups(rosters: RawRoster[] | undefined): TeamLineup[] {
  if (!rosters) return [];
  return rosters.map((r) => {
    const players: LineupPlayer[] = (r.roster ?? []).map((p) => ({
      name: p.athlete?.displayName ?? "Unknown",
      jersey: p.jersey ?? "",
      position: p.position?.abbreviation ?? "",
      starter: p.starter ?? false,
    }));
    return {
      teamId: r.team?.id ?? "",
      homeAway: r.homeAway === "away" ? "away" : "home",
      formation: r.formation ?? null,
      starters: players.filter((p) => p.starter),
      subs: players.filter((p) => !p.starter),
    };
  });
}

function statByAbbrev(stats: RawStat[] | undefined, abbrev: string): number {
  return stats?.find((s) => s.abbreviation === abbrev)?.value ?? 0;
}

function mapStandingsTeam(t: RawTeam | undefined): TeamSide {
  return {
    id: t?.id ?? "",
    name: t?.displayName ?? "TBD",
    abbreviation: t?.abbreviation ?? "",
    logo: t?.logo ?? t?.logos?.[0]?.href ?? null,
    score: null,
    homeAway: "home",
  };
}

function mapStandingsEntry(e: RawStandingsEntry): StandingsEntry {
  return {
    team: mapStandingsTeam(e.team),
    rank: statByAbbrev(e.stats, "R"),
    gamesPlayed: statByAbbrev(e.stats, "GP"),
    wins: statByAbbrev(e.stats, "W"),
    draws: statByAbbrev(e.stats, "D"),
    losses: statByAbbrev(e.stats, "L"),
    goalsFor: statByAbbrev(e.stats, "F"),
    goalsAgainst: statByAbbrev(e.stats, "A"),
    goalDifference: statByAbbrev(e.stats, "GD"),
    points: statByAbbrev(e.stats, "P"),
  };
}

function mapStandingsGroup(g: RawStandingsGroup): StandingsGroup | null {
  if (!g.name) return null;
  const entries = (g.standings?.entries ?? [])
    .map(mapStandingsEntry)
    .sort((a, b) => a.rank - b.rank);
  return {
    id: g.id ?? g.abbreviation ?? g.name,
    name: g.name,
    entries,
  };
}

function mapEvent(ev: RawEvent): Match | null {
  const comp = ev.competitions?.[0];
  if (!comp || !ev.id) return null;

  const competitors = comp.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = comp.status ?? ev.status ?? {};

  return {
    id: ev.id,
    date: ev.date ?? "",
    state: normalizeState(status.type?.state),
    statusDetail: status.type?.shortDetail ?? status.type?.description ?? "",
    clock: status.displayClock ?? "",
    home: mapCompetitor(home),
    away: mapCompetitor(away),
    goals: mapGoals(comp.details),
  };
}

// --- Public API ---

/**
 * Fetches the World Cup scoreboard. `dates` is an optional YYYYMMDD string;
 * omit it for the current/most-relevant matchday.
 *
 * The `cf` option forces Cloudflare's edge to cache ESPN's response for 30s
 * regardless of ESPN's own (no-cache) headers — this is what keeps ESPN hits
 * to ~2/min per region. In local `next dev` the `cf` field is ignored.
 */
export async function fetchScoreboard(dates?: string): Promise<Scoreboard> {
  const url = new URL(`${ESPN_BASE}/scoreboard`);
  if (dates) url.searchParams.set("dates", dates);

  const init: RequestInit & {
    cf?: { cacheTtl: number; cacheEverything: boolean };
  } = {
    cf: { cacheTtl: 30, cacheEverything: true },
  };

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`ESPN scoreboard returned ${res.status}`);
  }

  const raw = (await res.json()) as RawScoreboard;
  const matches = (raw.events ?? [])
    .map(mapEvent)
    .filter((m): m is Match => m !== null);

  return {
    date: raw.day?.date ?? null,
    matches,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches full detail for a single match (lineups, goal events, status) from
 * ESPN's `summary` endpoint. Returns null if the event is missing or malformed
 * so callers can render a 404. Same 30s edge cache as the scoreboard.
 */
export async function fetchSummary(eventId: string): Promise<MatchDetail | null> {
  const url = new URL(`${ESPN_BASE}/summary`);
  url.searchParams.set("event", eventId);

  const init: RequestInit & {
    cf?: { cacheTtl: number; cacheEverything: boolean };
  } = {
    cf: { cacheTtl: 30, cacheEverything: true },
  };

  const res = await fetch(url, init);
  if (!res.ok) return null;

  const raw = (await res.json()) as RawSummary;
  const comp = raw.header?.competitions?.[0];
  if (!comp) return null;

  const competitors = comp.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const status = comp.status ?? {};

  return {
    id: eventId,
    date: comp.date ?? "",
    state: normalizeState(status.type?.state),
    statusDetail: status.type?.shortDetail ?? status.type?.description ?? "",
    clock: status.displayClock ?? "",
    home: mapCompetitor(home),
    away: mapCompetitor(away),
    goals: mapGoals(comp.details),
    lineups: mapLineups(raw.rosters),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches the 12 group-stage standings. Uses the (different) `/apis/v2/...`
 * base, not the `/apis/site/v2/...` base scoreboard/summary use. Same 30s edge
 * cache. Returns an empty groups array if ESPN hasn't published standings yet
 * (which happens before the tournament starts).
 */
export async function fetchStandings(): Promise<Standings> {
  const url = `${ESPN_CORE_BASE}/standings`;

  const init: RequestInit & {
    cf?: { cacheTtl: number; cacheEverything: boolean };
  } = {
    cf: { cacheTtl: 30, cacheEverything: true },
  };

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`ESPN standings returned ${res.status}`);
  }

  const raw = (await res.json()) as RawStandingsResponse;
  const groups = (raw.children ?? [])
    .map(mapStandingsGroup)
    .filter((g): g is StandingsGroup => g !== null);

  return {
    groups,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches the full tournament schedule (all 104 matches) by issuing the two
 * range queries in parallel. ESPN auto-resolves knockout placeholders ("2A",
 * "Group L Winner") as the bracket fills in, so no community-maintained
 * fixture file is needed.
 */
export async function fetchAllFixtures(): Promise<Scoreboard> {
  const url1 = new URL(`${ESPN_BASE}/scoreboard`);
  url1.searchParams.set("dates", WC2026_RANGE_PART_1);
  const url2 = new URL(`${ESPN_BASE}/scoreboard`);
  url2.searchParams.set("dates", WC2026_RANGE_PART_2);

  const init: RequestInit & {
    cf?: { cacheTtl: number; cacheEverything: boolean };
  } = {
    cf: { cacheTtl: 30, cacheEverything: true },
  };

  const [res1, res2] = await Promise.all([fetch(url1, init), fetch(url2, init)]);
  if (!res1.ok || !res2.ok) {
    throw new Error(`ESPN fixtures returned ${res1.status} / ${res2.status}`);
  }

  const [raw1, raw2] = (await Promise.all([res1.json(), res2.json()])) as [
    RawScoreboard,
    RawScoreboard,
  ];

  const events = [...(raw1.events ?? []), ...(raw2.events ?? [])];
  const matches = events
    .map(mapEvent)
    .filter((m): m is Match => m !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    date: null,
    matches,
    fetchedAt: new Date().toISOString(),
  };
}
