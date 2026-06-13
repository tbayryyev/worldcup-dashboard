// FIFA world ranking lookup, backed by the curated `data/fifa-rankings.json`
// (ESPN exposes no ranking, so it's maintained by hand). Keyed by ESPN team id.
import rankings from "@/data/fifa-rankings.json";

export interface FifaRanking {
  rank: number;
  points: number;
}

const TABLE = rankings.teams as Record<
  string,
  { name: string; rank: number; points: number }
>;

export function fifaRanking(id: string): FifaRanking | null {
  const r = TABLE[id];
  return r ? { rank: r.rank, points: r.points } : null;
}
