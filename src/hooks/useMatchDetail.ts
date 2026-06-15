import { useQuery } from "@tanstack/react-query";
import type { MatchDetail } from "@/lib/espn";

const HOUR = 60 * 60 * 1000;

async function fetchDetail(id: string): Promise<MatchDetail> {
  // cache: "no-store" bypasses the browser's HTTP cache so refetches actually
  // hit the network (edge cache still serves cached responses fast).
  const res = await fetch(`/api/match/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/match/${id} returned ${res.status}`);
  return res.json();
}

// Poll only when it's worth it: fast while live, slower near kickoff, and
// stop entirely once the match is over (a finished result never changes).
function pollInterval(data: MatchDetail | undefined): number | false {
  if (!data) return 15_000;
  if (data.state === "in") return 15_000;
  if (data.state === "post") return false;
  if (data.date) {
    const delta = new Date(data.date).getTime() - Date.now();
    if (delta > 0 && delta < HOUR) return 2 * 60_000;
  }
  return 10 * 60_000;
}

export function useMatchDetail(id: string, initialData: MatchDetail) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: () => fetchDetail(id),
    initialData,
    // initialData is considered fresh by default → no fetch on mount. Force a
    // refetch every time so the client immediately verifies the SSR snapshot
    // (which can be up to ~30s old from the edge cache) and the Network tab
    // visibly fires on navigation. The call is cheap — usually an edge HIT.
    refetchOnMount: "always",
    refetchInterval: (query) => pollInterval(query.state.data),
  });
}
