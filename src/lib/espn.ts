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
  assist: string | null; // assisting player, when ESPN provides it
  type: string; // "Goal - Header"
  penalty: boolean;
  ownGoal: boolean;
}

// A single notable in-game event for the match timeline / feed.
export type MatchEventType = "goal" | "yellow" | "red" | "sub" | "other";

export interface MatchEvent {
  type: MatchEventType;
  clock: string; // "33'"
  period: number;
  teamId: string;
  text: string; // ESPN's full description, e.g. "Goal! ... Assisted by ..."
  penalty: boolean;
  ownGoal: boolean;
  scorer: string | null; // goals
  assist: string | null; // goals
  playerIn: string | null; // substitutions
  playerOut: string | null; // substitutions
  player: string | null; // cards (and other single-player events)
}

// One team-vs-team statistic (possession, shots, etc.).
export interface TeamStat {
  name: string; // ESPN machine name, e.g. "possessionPct"
  label: string; // human label, e.g. "Possession"
  displayValue: string; // formatted value, e.g. "60.5"
}

export interface TeamStats {
  teamId: string;
  homeAway: "home" | "away";
  stats: TeamStat[];
}

export interface Match {
  id: string;
  date: string; // ISO
  state: MatchState;
  statusName: string; // ESPN status enum, e.g. "STATUS_HALFTIME"
  statusDetail: string; // "Scheduled" / "FT" / "33'"
  clock: string; // displayClock, e.g. "45'"
  round: string | null; // season slug, e.g. "group-stage" | "quarterfinals"
  home: TeamSide;
  away: TeamSide;
  goals: GoalEvent[];
}

export interface Scoreboard {
  date: string | null;
  matches: Match[];
  fetchedAt: string;
}

// What the Home page consumes: either today's slate, or — if nothing is on
// today — the next matchday's slate. `scope` lets the UI title itself.
export interface HomeScoreboard extends Scoreboard {
  scope: "today" | "upcoming" | "none";
}

export interface PlayerStatLine {
  name: string; // ESPN machine name, e.g. "totalShots"
  label: string; // friendly label, e.g. "Shots"
  value: string;
}

export interface LineupPlayer {
  id: string;
  name: string;
  jersey: string;
  position: string;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  stats: PlayerStatLine[]; // per-match player stats (empty pre-match)
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
  statusName: string; // ESPN status enum, e.g. "STATUS_HALFTIME"
  statusDetail: string;
  clock: string;
  home: TeamSide;
  away: TeamSide;
  goals: GoalEvent[];
  events: MatchEvent[]; // full timeline: goals, cards, subs
  teamStats: TeamStats[]; // possession, shots, etc. (empty pre-match)
  lineups: TeamLineup[];
  venue: MatchVenue | null;
  attendance: number | null;
  referee: string | null;
  headToHead: H2HGame[];
  leaders: TeamLeaders[];
  commentary: CommentaryItem[]; // chronological (oldest first)
  fetchedAt: string;
}

export interface MatchVenue {
  name: string;
  city: string | null;
  country: string | null;
}

export interface H2HGame {
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: string;
  awayScore: string;
  competition: string | null;
}

export interface LeaderItem {
  category: string; // human label, e.g. "Shots"
  player: string;
  value: string;
}

export interface TeamLeaders {
  teamId: string;
  items: LeaderItem[];
}

export interface CommentaryItem {
  clock: string; // "45'+2'" or ""
  text: string;
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

// A third-placed team in the cross-group race. In the 48-team 2026 format the
// 8 best third-placed teams (of 12) advance to the Round of 32 alongside the
// two automatic qualifiers from each group.
export interface ThirdPlaceEntry extends StandingsEntry {
  groupName: string; // "Group A"
  qualifies: boolean; // top 8 of the third-placed teams
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
  type?: { name?: string; state?: string; description?: string; shortDetail?: string };
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
  season?: { slug?: string; type?: number };
  competitions?: RawCompetition[];
}

interface RawScoreboard {
  day?: { date?: string };
  events?: RawEvent[];
}

interface RawPlayerStat {
  name?: string;
  displayName?: string;
  abbreviation?: string;
  displayValue?: string;
}

interface RawRosterPlayer {
  starter?: boolean;
  jersey?: string;
  athlete?: { id?: string; displayName?: string };
  position?: { abbreviation?: string };
}

interface RawRosterPlayerFull extends RawRosterPlayer {
  subbedIn?: boolean;
  subbedOut?: boolean;
  stats?: RawPlayerStat[];
}

interface RawRoster {
  homeAway?: string;
  formation?: string;
  team?: { id?: string };
  roster?: RawRosterPlayerFull[];
}

interface RawKeyEvent {
  type?: { text?: string };
  clock?: { displayValue?: string };
  period?: { number?: number };
  team?: { id?: string };
  scoringPlay?: boolean;
  text?: string;
  participants?: { athlete?: { displayName?: string } }[];
}

interface RawBoxStat {
  name?: string;
  abbreviation?: string;
  label?: string;
  displayName?: string;
  displayValue?: string;
}

interface RawBoxscoreTeam {
  homeAway?: string;
  team?: { id?: string };
  statistics?: RawBoxStat[];
}

interface RawBoxscore {
  teams?: RawBoxscoreTeam[];
}

interface RawGameInfo {
  venue?: {
    fullName?: string;
    shortName?: string;
    address?: { city?: string; country?: string };
  };
  attendance?: number;
  officials?: { displayName?: string }[];
}

interface RawH2HEvent {
  gameDate?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamScore?: string;
  awayTeamScore?: string;
  competitionName?: string;
  leagueName?: string;
}

interface RawLeaderCategory {
  name?: string;
  displayName?: string;
  shortDisplayName?: string;
  leaders?: {
    displayValue?: string;
    athlete?: { displayName?: string };
  }[];
}

interface RawLeaderTeam {
  team?: { id?: string };
  leaders?: RawLeaderCategory[];
}

interface RawCommentary {
  time?: { displayValue?: string };
  text?: string;
}

interface RawSummary {
  header?: { competitions?: RawCompetition[] };
  rosters?: RawRoster[];
  keyEvents?: RawKeyEvent[];
  boxscore?: RawBoxscore;
  gameInfo?: RawGameInfo;
  headToHeadGames?: { team?: { id?: string }; events?: RawH2HEvent[] }[];
  leaders?: RawLeaderTeam[];
  commentary?: RawCommentary[];
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
      assist: d.athletesInvolved?.[1]?.displayName ?? null,
      type: d.type?.text ?? "Goal",
      penalty: d.penaltyKick ?? false,
      ownGoal: d.ownGoal ?? false,
    }));
}

// ESPN's keyEvents feed is richer than scoreboard `details`: it carries cards,
// substitutions, and assist credits. We keep only the notable types and map
// each into a flat MatchEvent the UI can render without re-parsing prose.
function classifyEvent(typeText: string, scoringPlay: boolean): MatchEventType {
  const t = typeText.toLowerCase();
  if (scoringPlay || t.includes("goal")) return "goal";
  if (t.includes("yellow")) return "yellow";
  if (t.includes("red")) return "red";
  if (t.includes("substitution")) return "sub";
  return "other";
}

function mapKeyEvents(events: RawKeyEvent[] | undefined): MatchEvent[] {
  if (!events) return [];
  return events
    .map((e): MatchEvent | null => {
      const typeText = e.type?.text ?? "";
      const scoringPlay = e.scoringPlay ?? false;
      const kind = classifyEvent(typeText, scoringPlay);
      if (kind === "other") return null;

      const names = (e.participants ?? [])
        .map((p) => p.athlete?.displayName ?? "")
        .filter(Boolean);
      const text = e.text ?? "";

      return {
        type: kind,
        clock: e.clock?.displayValue ?? "",
        period: e.period?.number ?? 0,
        teamId: e.team?.id ?? "",
        text,
        penalty: /penalt/i.test(typeText) || /penalty/i.test(text),
        ownGoal: /own goal/i.test(typeText) || /own goal/i.test(text),
        // Goal: participants[0] = scorer, [1] = assister (when present).
        scorer: kind === "goal" ? names[0] ?? null : null,
        assist: kind === "goal" ? names[1] ?? null : null,
        // Substitution: participants[0] = player coming on, [1] = coming off.
        playerIn: kind === "sub" ? names[0] ?? null : null,
        playerOut: kind === "sub" ? names[1] ?? null : null,
        // Cards: the single booked player.
        player:
          kind === "yellow" || kind === "red" ? names[0] ?? null : null,
      };
    })
    .filter((e): e is MatchEvent => e !== null);
}

function mapTeamStats(boxscore: RawBoxscore | undefined): TeamStats[] {
  if (!boxscore?.teams) return [];
  return boxscore.teams.map((t) => ({
    teamId: t.team?.id ?? "",
    homeAway: t.homeAway === "away" ? "away" : "home",
    stats: (t.statistics ?? []).map((s) => ({
      name: s.name ?? "",
      label: s.label ?? s.displayName ?? s.name ?? "",
      displayValue: s.displayValue ?? "",
    })),
  }));
}

// Friendly labels for the per-player stats ESPN's roster feed exposes.
const PLAYER_STAT_LABELS: Record<string, string> = {
  totalGoals: "Goals",
  goalAssists: "Assists",
  totalShots: "Shots",
  shotsOnTarget: "Shots on target",
  foulsCommitted: "Fouls",
  foulsSuffered: "Fouls won",
  offsides: "Offsides",
  yellowCards: "Yellow cards",
  redCards: "Red cards",
  ownGoals: "Own goals",
  saves: "Saves",
  goalsConceded: "Goals conceded",
  shotsFaced: "Shots faced",
};

function mapPlayerStats(stats: RawPlayerStat[] | undefined): PlayerStatLine[] {
  if (!stats) return [];
  return stats.map((s) => ({
    name: s.name ?? "",
    label: PLAYER_STAT_LABELS[s.name ?? ""] ?? s.displayName ?? s.name ?? "",
    value: s.displayValue ?? "0",
  }));
}

function mapLineups(rosters: RawRoster[] | undefined): TeamLineup[] {
  if (!rosters) return [];
  return rosters.map((r) => {
    const players: LineupPlayer[] = (r.roster ?? []).map((p) => ({
      id: p.athlete?.id ?? "",
      name: p.athlete?.displayName ?? "Unknown",
      jersey: p.jersey ?? "",
      position: p.position?.abbreviation ?? "",
      starter: p.starter ?? false,
      subbedIn: p.subbedIn ?? false,
      subbedOut: p.subbedOut ?? false,
      stats: mapPlayerStats(p.stats),
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

// Friendly labels for the leader categories ESPN returns; falls back to the
// API's own displayName when we don't have a nicer one.
const LEADER_LABELS: Record<string, string> = {
  totalShots: "Shots",
  shotsOnTarget: "Shots on target",
  accuratePasses: "Passes",
  totalGoals: "Goals",
  goalAssists: "Assists",
  saves: "Saves",
  defensiveInterventions: "Defensive actions",
  totalTackles: "Tackles",
  foulsCommitted: "Fouls",
};

function mapGameInfo(gi: RawGameInfo | undefined): {
  venue: MatchVenue | null;
  attendance: number | null;
  referee: string | null;
} {
  const v = gi?.venue;
  return {
    venue: v
      ? {
          name: v.fullName ?? v.shortName ?? "",
          city: v.address?.city ?? null,
          country: v.address?.country ?? null,
        }
      : null,
    attendance: typeof gi?.attendance === "number" ? gi.attendance : null,
    referee: gi?.officials?.[0]?.displayName ?? null,
  };
}

function mapHeadToHead(
  blocks: RawSummary["headToHeadGames"],
): H2HGame[] {
  const events = blocks?.[0]?.events ?? [];
  return events
    .map((e) => ({
      date: e.gameDate ?? "",
      homeTeamId: e.homeTeamId ?? "",
      awayTeamId: e.awayTeamId ?? "",
      homeScore: e.homeTeamScore ?? "",
      awayScore: e.awayTeamScore ?? "",
      competition: e.competitionName ?? e.leagueName ?? null,
    }))
    .filter((g) => g.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function mapLeaders(raw: RawLeaderTeam[] | undefined): TeamLeaders[] {
  if (!raw) return [];
  return raw
    .map((t) => ({
      teamId: t.team?.id ?? "",
      items: (t.leaders ?? [])
        .map((cat): LeaderItem | null => {
          const top = cat.leaders?.[0];
          if (!top?.athlete?.displayName) return null;
          return {
            category:
              LEADER_LABELS[cat.name ?? ""] ??
              cat.shortDisplayName ??
              cat.displayName ??
              cat.name ??
              "",
            player: top.athlete.displayName,
            value: top.displayValue ?? "",
          };
        })
        .filter((x): x is LeaderItem => x !== null),
    }))
    .filter((t) => t.teamId && t.items.length > 0);
}

function mapCommentary(raw: RawCommentary[] | undefined): CommentaryItem[] {
  if (!raw) return [];
  return raw
    .filter((c) => c.text)
    .map((c) => ({ clock: c.time?.displayValue ?? "", text: c.text ?? "" }));
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
    statusName: status.type?.name ?? "",
    statusDetail: status.type?.shortDetail ?? status.type?.description ?? "",
    clock: status.displayClock ?? "",
    round: ev.season?.slug ?? null,
    home: mapCompetitor(home),
    away: mapCompetitor(away),
    goals: mapGoals(comp.details),
  };
}

/**
 * The short status label to show for a live match. ESPN freezes `displayClock`
 * at "45'" during the interval but flips the status to STATUS_HALFTIME, so we
 * surface an explicit "HT" there; otherwise we show the running minute.
 */
export function liveStatusLabel(m: {
  statusName: string;
  clock: string;
  statusDetail: string;
}): string {
  if (m.statusName === "STATUS_HALFTIME") return "HT";
  return m.clock || m.statusDetail || "LIVE";
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
    // 15s so live scores stay fresh for the 15s client poll cadence.
    cf: { cacheTtl: 15, cacheEverything: true },
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

// ESPN groups its scoreboard by US Eastern calendar day, so we compute "today"
// in that zone to line up with how ESPN buckets matches.
function easternYYYYMMDD(d: Date): string {
  // en-CA renders as YYYY-MM-DD; strip the dashes for ESPN's ?dates= format.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/-/g, "");
}

/**
 * Home-page scoreboard. Returns today's matches if any are scheduled today;
 * otherwise looks ahead and returns the next matchday's slate (so the page is
 * never empty during off-days). `scope` tells the UI which case it got.
 */
export async function fetchHomeScoreboard(): Promise<HomeScoreboard> {
  const today = easternYYYYMMDD(new Date());

  const todaySb = await fetchScoreboard(today);
  if (todaySb.matches.length > 0) {
    return { ...todaySb, scope: "today" };
  }

  // Nothing today — scan the next 30 days in one range query and surface the
  // earliest matchday found.
  const end = easternYYYYMMDD(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );
  const ahead = await fetchScoreboard(`${today}-${end}`);
  const upcoming = ahead.matches
    .filter((m) => m.date && easternYYYYMMDD(new Date(m.date)) > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    return { ...ahead, matches: [], scope: "none" };
  }

  const nextDay = easternYYYYMMDD(new Date(upcoming[0].date));
  const matches = upcoming.filter(
    (m) => easternYYYYMMDD(new Date(m.date)) === nextDay,
  );
  return { ...ahead, matches, scope: "upcoming" };
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
    // 15s so live match detail keeps pace with the 15s client poll cadence.
    cf: { cacheTtl: 15, cacheEverything: true },
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

  // keyEvents carries assists/cards/subs; the header `details` only has bare
  // scorers. Prefer keyEvents for goals (so assists show), fall back to the
  // header when the feed is empty (e.g. very early in a live match).
  const events = mapKeyEvents(raw.keyEvents);
  const goalsFromEvents: GoalEvent[] = events
    .filter((e) => e.type === "goal")
    .map((e) => ({
      clock: e.clock,
      teamId: e.teamId,
      scorer: e.scorer,
      assist: e.assist,
      type: "Goal",
      penalty: e.penalty,
      ownGoal: e.ownGoal,
    }));
  const goals = goalsFromEvents.length > 0 ? goalsFromEvents : mapGoals(comp.details);

  return {
    id: eventId,
    date: comp.date ?? "",
    state: normalizeState(status.type?.state),
    statusName: status.type?.name ?? "",
    statusDetail: status.type?.shortDetail ?? status.type?.description ?? "",
    clock: status.displayClock ?? "",
    home: mapCompetitor(home),
    away: mapCompetitor(away),
    goals,
    events,
    teamStats: mapTeamStats(raw.boxscore),
    lineups: mapLineups(raw.rosters),
    ...mapGameInfo(raw.gameInfo),
    headToHead: mapHeadToHead(raw.headToHeadGames),
    leaders: mapLeaders(raw.leaders),
    commentary: mapCommentary(raw.commentary),
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

// Ranks the third-placed team from every group against each other and flags the
// top 8 as qualifying. FIFA's published tiebreakers are: points, then goal
// difference, then goals scored — after that come disciplinary record and a
// drawing of lots, neither of which the API exposes, so ties beyond goals
// scored are ordered by name purely for a stable, deterministic display.
export function bestThirdPlaced(standings: Standings): ThirdPlaceEntry[] {
  const thirds = standings.groups
    .map((g) => {
      const e = g.entries.find((x) => x.rank === 3);
      return e ? { ...e, groupName: g.name, qualifies: false } : null;
    })
    .filter((x): x is ThirdPlaceEntry => x !== null);

  thirds.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name),
  );

  return thirds.map((t, i) => ({ ...t, qualifies: i < 8 }));
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

  // De-duplicate by event id: the two date windows are meant to be disjoint,
  // but ESPN occasionally returns a boundary match in both, which would
  // otherwise double-count it in fixtures, the bracket and the stats build.
  const events = [...(raw1.events ?? []), ...(raw2.events ?? [])];
  const seen = new Set<string>();
  const matches = events
    .map(mapEvent)
    .filter((m): m is Match => m !== null)
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    date: null,
    matches,
    fetchedAt: new Date().toISOString(),
  };
}

// --- Teams ---

export interface TeamListItem {
  id: string;
  name: string;
  abbreviation: string;
  logo: string | null;
}

export interface SquadPlayer {
  id: string;
  name: string;
  jersey: string;
  positionAbbr: string; // "G" | "D" | "M" | "F"
  positionName: string; // "Goalkeeper", etc.
  age: number | null;
  height: string; // displayHeight, e.g. "5' 8\""
}

export interface AgeProfile {
  squadSize: number;
  average: number | null;
  youngest: { name: string; age: number } | null;
  oldest: { name: string; age: number } | null;
  under21: number;
  under23: number;
}

export interface TeamFormMatch {
  matchId: string;
  date: string;
  opponent: string;
  opponentAbbr: string;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "D" | "L";
}

export interface TeamNextMatch {
  matchId: string;
  date: string;
  opponent: string;
  opponentAbbr: string;
  state: MatchState;
  statusDetail: string;
}

export interface TeamProfile {
  id: string;
  name: string;
  abbreviation: string;
  logo: string | null;
  color: string | null;
  groupName: string | null;
  rank: number | null;
  points: number | null;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  ageProfile: AgeProfile;
  squad: SquadPlayer[];
  recentForm: TeamFormMatch[]; // finished WC matches, newest first
  nextMatch: TeamNextMatch | null;
  fetchedAt: string;
}

interface RawTeamsList {
  sports?: { leagues?: { teams?: { team?: RawTeam }[] }[] }[];
}

interface RawAthlete {
  id?: string;
  displayName?: string;
  age?: number;
  jersey?: string;
  displayHeight?: string;
  position?: { abbreviation?: string; name?: string };
}

interface RawTeamDetail {
  team?: RawTeam & { color?: string; athletes?: RawAthlete[] };
}

function mapSquad(athletes: RawAthlete[] | undefined): SquadPlayer[] {
  if (!athletes) return [];
  return athletes.map((a) => ({
    id: a.id ?? "",
    name: a.displayName ?? "Unknown",
    jersey: a.jersey ?? "",
    positionAbbr: a.position?.abbreviation ?? "",
    positionName: a.position?.name ?? "",
    age: typeof a.age === "number" ? a.age : null,
    height: a.displayHeight ?? "",
  }));
}

function computeAgeProfile(squad: SquadPlayer[]): AgeProfile {
  const withAge = squad.filter(
    (p): p is SquadPlayer & { age: number } => p.age != null,
  );
  const ages = withAge.map((p) => p.age);
  const average =
    ages.length > 0
      ? Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10
      : null;
  const youngest =
    withAge.length > 0
      ? withAge.reduce((m, p) => (p.age < m.age ? p : m))
      : null;
  const oldest =
    withAge.length > 0
      ? withAge.reduce((m, p) => (p.age > m.age ? p : m))
      : null;
  return {
    squadSize: squad.length,
    average,
    youngest: youngest ? { name: youngest.name, age: youngest.age } : null,
    oldest: oldest ? { name: oldest.name, age: oldest.age } : null,
    under21: ages.filter((a) => a < 21).length,
    under23: ages.filter((a) => a < 23).length,
  };
}

/**
 * Fetches the 48-team tournament field (id, name, logo), sorted by name.
 */
export async function fetchTeams(): Promise<TeamListItem[]> {
  const init: RequestInit & {
    cf?: { cacheTtl: number; cacheEverything: boolean };
  } = { cf: { cacheTtl: 30, cacheEverything: true } };

  const res = await fetch(`${ESPN_BASE}/teams`, init);
  if (!res.ok) throw new Error(`ESPN teams returned ${res.status}`);

  const raw = (await res.json()) as RawTeamsList;
  const entries = raw.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return entries
    .map((e) => e.team)
    .filter((t): t is RawTeam => !!t?.id)
    .map((t) => ({
      id: t.id as string,
      name: t.displayName ?? "TBD",
      abbreviation: t.abbreviation ?? "",
      logo: t.logo ?? t.logos?.[0]?.href ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Builds a full team profile: squad (with computed age stats), the team's
 * group/record from standings, and recent form + next match from the fixture
 * list. Returns null if ESPN doesn't recognise the id. Four ESPN subrequests,
 * all 30s-edge-cached. Historical context (titles, FIFA rank) is layered on in
 * the UI from the curated `teamInfo` table — ESPN doesn't expose it.
 */
export async function fetchTeamProfile(id: string): Promise<TeamProfile | null> {
  const init: RequestInit & {
    cf?: { cacheTtl: number; cacheEverything: boolean };
  } = { cf: { cacheTtl: 30, cacheEverything: true } };

  const teamUrl = new URL(`${ESPN_BASE}/teams/${id}`);
  teamUrl.searchParams.set("enable", "roster");

  const [teamRes, standings, fixtures] = await Promise.all([
    fetch(teamUrl, init),
    fetchStandings().catch(() => null),
    fetchAllFixtures().catch(() => null),
  ]);

  if (!teamRes.ok) return null;
  const raw = (await teamRes.json()) as RawTeamDetail;
  const t = raw.team;
  if (!t?.id) return null;

  const squad = mapSquad(t.athletes);

  // Group + record from the standings tables.
  let groupName: string | null = null;
  let rank: number | null = null;
  let points: number | null = null;
  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0;
  for (const g of standings?.groups ?? []) {
    const entry = g.entries.find((e) => e.team.id === id);
    if (entry) {
      groupName = g.name;
      rank = entry.rank;
      points = entry.points;
      wins = entry.wins;
      draws = entry.draws;
      losses = entry.losses;
      goalsFor = entry.goalsFor;
      goalsAgainst = entry.goalsAgainst;
      break;
    }
  }

  // Recent form + next match from the fixture list.
  const recentForm: TeamFormMatch[] = [];
  let nextMatch: TeamNextMatch | null = null;
  const mine = (fixtures?.matches ?? []).filter(
    (m) => m.home.id === id || m.away.id === id,
  );
  for (const m of mine
    .filter((m) => m.state === "post")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)) {
    const isHome = m.home.id === id;
    const me = isHome ? m.home : m.away;
    const opp = isHome ? m.away : m.home;
    const sf = me.score ?? 0;
    const sa = opp.score ?? 0;
    recentForm.push({
      matchId: m.id,
      date: m.date,
      opponent: opp.name,
      opponentAbbr: opp.abbreviation,
      scoreFor: sf,
      scoreAgainst: sa,
      result: sf > sa ? "W" : sf < sa ? "L" : "D",
    });
  }
  const upcoming = mine
    .filter((m) => m.state !== "post")
    .sort((a, b) => a.date.localeCompare(b.date));
  const nm = upcoming.find((m) => m.state === "in") ?? upcoming[0];
  if (nm) {
    const opp = nm.home.id === id ? nm.away : nm.home;
    nextMatch = {
      matchId: nm.id,
      date: nm.date,
      opponent: opp.name,
      opponentAbbr: opp.abbreviation,
      state: nm.state,
      statusDetail: nm.statusDetail,
    };
  }

  return {
    id: t.id,
    name: t.displayName ?? "TBD",
    abbreviation: t.abbreviation ?? "",
    logo: t.logo ?? t.logos?.[0]?.href ?? null,
    color: t.color ?? null,
    groupName,
    rank,
    points,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    ageProfile: computeAgeProfile(squad),
    squad,
    recentForm,
    nextMatch,
    fetchedAt: new Date().toISOString(),
  };
}
