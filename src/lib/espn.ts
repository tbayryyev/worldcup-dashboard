// Thin adapter over ESPN's undocumented public Site API.
// All ESPN calls go through this file so a schema break is a one-file fix.

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";

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

// --- Raw ESPN shapes (only the fields we read; everything is optional
// because the API is undocumented and can omit fields without notice). ---

interface RawTeam {
  id?: string;
  displayName?: string;
  abbreviation?: string;
  logo?: string;
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
    logo: t.logo ?? null,
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
