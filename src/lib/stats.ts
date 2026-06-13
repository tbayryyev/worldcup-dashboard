// Shape of the precomputed tournament-stats asset (`public/stats.json`).
//
// ESPN exposes no tournament-leaders endpoint for fifa.world (verified — every
// leaders/* path 404s), so player leaderboards must be aggregated from each
// finished match's `summary`. Aggregating live inside a Worker route would blow
// Cloudflare's free-tier 50-subrequests-per-request cap once dozens of matches
// are played, so a GitHub Actions cron runs `scripts/build-stats.ts` on a
// schedule, writes this file, and it's served as a static asset. Same pattern
// CLAUDE.md describes for history.json.

export interface PlayerStat {
  name: string;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  teamLogo: string | null;
  goals: number;
  assists: number;
}

export interface PlayerDiscipline {
  name: string;
  teamId: string;
  teamAbbr: string;
  teamLogo: string | null;
  yellow: number;
  red: number;
}

export interface TeamGoalStat {
  teamId: string;
  name: string;
  abbr: string;
  logo: string | null;
  group: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface TeamPassingStat {
  teamId: string;
  name: string;
  abbr: string;
  logo: string | null;
  matches: number;
  accuratePasses: number;
  totalPasses: number;
  passPct: number; // 0–100
}

export interface TeamDiscipline {
  teamId: string;
  name: string;
  abbr: string;
  logo: string | null;
  yellow: number;
  red: number;
}

export interface StatsData {
  generatedAt: string;
  matchesPlayed: number;
  totalGoals: number;
  topScorers: PlayerStat[];
  topAssisters: PlayerStat[];
  playerDiscipline: PlayerDiscipline[];
  teamGoals: TeamGoalStat[];
  teamPassing: TeamPassingStat[];
  teamDiscipline: TeamDiscipline[];
}
