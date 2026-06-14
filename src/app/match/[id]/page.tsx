import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchSummary } from "@/lib/espn";
import { MatchDetailView } from "@/components/MatchDetailView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await fetchSummary(id).catch(() => null);
  if (!d) return { title: "Match" };
  const matchup = `${d.home.name} vs ${d.away.name}`;
  const score =
    d.state !== "pre" ? ` ${d.home.score ?? 0}–${d.away.score ?? 0}` : "";
  return {
    title: `${matchup}${score}`,
    description: `${matchup} — World Cup 2026 live score, lineups, timeline and stats.`,
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchSummary(id);
  if (!detail) notFound();

  // Server-render the first snapshot (fast paint, works without JS), then the
  // client view polls /api/match/[id] for live updates seeded with this data.
  return <MatchDetailView id={id} initialData={detail} />;
}
