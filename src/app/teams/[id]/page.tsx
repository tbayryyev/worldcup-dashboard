import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchTeamProfile, fetchTeams } from "@/lib/espn";
import { teamHistory } from "@/lib/teamInfo";
import { fifaRanking } from "@/lib/fifaRanking";
import { TeamProfileView } from "@/components/TeamProfileView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const teams = await fetchTeams().catch(() => []);
  const name = teams.find((t) => t.id === id)?.name ?? "Team";
  return {
    title: name,
    description: `${name} at the World Cup 2026 — squad, history, FIFA ranking, recent form and next match.`,
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await fetchTeamProfile(id);
  if (!profile) notFound();

  return (
    <TeamProfileView
      profile={profile}
      history={teamHistory(id)}
      ranking={fifaRanking(id)}
    />
  );
}
