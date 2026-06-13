// Precomputes tournament-wide stats into public/stats.json.
//
// Run by GitHub Actions cron (and `npm run build:stats` locally). Runs in Node,
// NOT in a Worker, so it's free of the 50-subrequest cap and can fetch every
// finished match's summary to aggregate scorers/assisters/cards/passing. See
// src/lib/stats.ts for why this is a precomputed asset rather than a live route.

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchAllFixtures,
  fetchSummary,
  fetchStandings,
  type MatchDetail,
  type TeamSide,
} from "../src/lib/espn";
import type {
  StatsData,
  PlayerStat,
  PlayerDiscipline,
  TeamGoalStat,
  TeamPassingStat,
  TeamDiscipline,
} from "../src/lib/stats";

// Resolve a small pool of promises at a time so we don't fire 100+ requests at
// ESPN simultaneously.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return out;
}

function statNum(detail: MatchDetail, teamId: string, name: string): number {
  const team = detail.teamStats.find((t) => t.teamId === teamId);
  const v = team?.stats.find((s) => s.name === name)?.displayValue;
  const n = v != null ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

async function main() {
  const fixtures = await fetchAllFixtures();
  const finished = fixtures.matches.filter((m) => m.state === "post");
  console.log(`Found ${finished.length} finished matches.`);

  const summaries = await mapWithConcurrency(finished, 6, (m) =>
    fetchSummary(m.id).catch(() => null),
  );

  // Team metadata (logos/names) — prefer standings, fall back to match sides.
  const teamMeta = new Map<string, { name: string; abbr: string; logo: string | null }>();
  const rememberTeam = (t: TeamSide) => {
    if (t.id && !teamMeta.has(t.id)) {
      teamMeta.set(t.id, { name: t.name, abbr: t.abbreviation, logo: t.logo });
    }
  };

  // --- Player aggregation (goals, assists, cards) ---
  interface PlayerAgg {
    name: string;
    teamId: string;
    goals: number;
    assists: number;
    yellow: number;
    red: number;
  }
  const players = new Map<string, PlayerAgg>();
  const playerKey = (name: string, teamId: string) => `${name}__${teamId}`;
  const bumpPlayer = (
    name: string,
    teamId: string,
    field: "goals" | "assists" | "yellow" | "red",
  ) => {
    const k = playerKey(name, teamId);
    const p =
      players.get(k) ??
      ({ name, teamId, goals: 0, assists: 0, yellow: 0, red: 0 } as PlayerAgg);
    p[field]++;
    players.set(k, p);
  };

  // --- Team passing + cards aggregation ---
  interface TeamAgg {
    accuratePasses: number;
    totalPasses: number;
    matches: number;
    yellow: number;
    red: number;
  }
  const teamAgg = new Map<string, TeamAgg>();
  const teamA = (id: string): TeamAgg => {
    let a = teamAgg.get(id);
    if (!a) {
      a = { accuratePasses: 0, totalPasses: 0, matches: 0, yellow: 0, red: 0 };
      teamAgg.set(id, a);
    }
    return a;
  };

  let totalGoals = 0;

  finished.forEach((m, idx) => {
    totalGoals += (m.home.score ?? 0) + (m.away.score ?? 0);
    rememberTeam(m.home);
    rememberTeam(m.away);

    const sum = summaries[idx];
    if (!sum) return;
    rememberTeam(sum.home);
    rememberTeam(sum.away);

    // Goals + assists.
    for (const g of sum.goals) {
      if (!g.teamId) continue;
      if (g.scorer && !g.ownGoal) bumpPlayer(g.scorer, g.teamId, "goals");
      if (g.assist) bumpPlayer(g.assist, g.teamId, "assists");
    }

    // Cards (player + team).
    for (const ev of sum.events) {
      if (ev.type !== "yellow" && ev.type !== "red") continue;
      const field = ev.type;
      if (ev.player && ev.teamId) bumpPlayer(ev.player, ev.teamId, field);
      if (ev.teamId) teamA(ev.teamId)[field]++;
    }

    // Passing (from the team boxscore), per side that has the data.
    for (const side of [sum.home, sum.away]) {
      const total = statNum(sum, side.id, "totalPasses");
      if (total <= 0) continue;
      const acc = statNum(sum, side.id, "accuratePasses");
      const a = teamA(side.id);
      a.accuratePasses += acc;
      a.totalPasses += total;
      a.matches++;
    }
  });

  const meta = (id: string) =>
    teamMeta.get(id) ?? { name: "Unknown", abbr: "", logo: null };

  const allPlayers = [...players.values()];
  const toPlayerStat = (p: PlayerAgg): PlayerStat => {
    const t = meta(p.teamId);
    return {
      name: p.name,
      teamId: p.teamId,
      teamName: t.name,
      teamAbbr: t.abbr,
      teamLogo: t.logo,
      goals: p.goals,
      assists: p.assists,
    };
  };

  const topScorers = allPlayers
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.name.localeCompare(b.name))
    .slice(0, 30)
    .map(toPlayerStat);

  const topAssisters = allPlayers
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, 30)
    .map(toPlayerStat);

  const playerDiscipline: PlayerDiscipline[] = allPlayers
    .filter((p) => p.yellow > 0 || p.red > 0)
    .sort((a, b) => b.red - a.red || b.yellow - a.yellow || a.name.localeCompare(b.name))
    .slice(0, 30)
    .map((p) => {
      const t = meta(p.teamId);
      return {
        name: p.name,
        teamId: p.teamId,
        teamAbbr: t.abbr,
        teamLogo: t.logo,
        yellow: p.yellow,
        red: p.red,
      };
    });

  // --- Team goals from the standings tables ---
  const standings = await fetchStandings();
  const teamGoals: TeamGoalStat[] = standings.groups
    .flatMap((g) =>
      g.entries.map((e) => ({
        teamId: e.team.id,
        name: e.team.name,
        abbr: e.team.abbreviation,
        logo: e.team.logo,
        group: g.name,
        played: e.gamesPlayed,
        goalsFor: e.goalsFor,
        goalsAgainst: e.goalsAgainst,
        goalDifference: e.goalDifference,
      })),
    )
    .sort((a, b) => b.goalsFor - a.goalsFor || b.goalDifference - a.goalDifference);

  const teamPassing: TeamPassingStat[] = [...teamAgg.entries()]
    .filter(([, a]) => a.totalPasses > 0)
    .map(([id, a]) => {
      const t = meta(id);
      return {
        teamId: id,
        name: t.name,
        abbr: t.abbr,
        logo: t.logo,
        matches: a.matches,
        accuratePasses: a.accuratePasses,
        totalPasses: a.totalPasses,
        passPct: Math.round((a.accuratePasses / a.totalPasses) * 1000) / 10,
      };
    })
    .sort((a, b) => b.passPct - a.passPct);

  const teamDiscipline: TeamDiscipline[] = [...teamAgg.entries()]
    .filter(([, a]) => a.yellow > 0 || a.red > 0)
    .map(([id, a]) => {
      const t = meta(id);
      return {
        teamId: id,
        name: t.name,
        abbr: t.abbr,
        logo: t.logo,
        yellow: a.yellow,
        red: a.red,
      };
    })
    .sort((a, b) => b.red - a.red || b.yellow - a.yellow);

  const data: StatsData = {
    generatedAt: new Date().toISOString(),
    matchesPlayed: finished.length,
    totalGoals,
    topScorers,
    topAssisters,
    playerDiscipline,
    teamGoals,
    teamPassing,
    teamDiscipline,
  };

  const outDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "public",
  );
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "stats.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(
    `Wrote ${outPath} — ${finished.length} matches, ${topScorers.length} scorers, ` +
      `${topAssisters.length} assisters, ${teamGoals.length} teams.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
