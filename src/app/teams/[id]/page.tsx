import { notFound } from "next/navigation";
import { fetchTeamProfile } from "@/lib/espn";
import { teamHistory } from "@/lib/teamInfo";
import { fifaRanking } from "@/lib/fifaRanking";
import { TeamProfileView } from "@/components/TeamProfileView";

export const dynamic = "force-dynamic";

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
