import { notFound } from "next/navigation";
import { fetchSummary } from "@/lib/espn";
import { MatchDetailView } from "@/components/MatchDetailView";

export const dynamic = "force-dynamic";

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
