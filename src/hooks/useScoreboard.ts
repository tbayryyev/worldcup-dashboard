import { useQuery } from "@tanstack/react-query";
import type { HomeScoreboard } from "@/lib/espn";

const HOUR = 60 * 60 * 1000;

async function fetchLive(): Promise<HomeScoreboard> {
  // cache: "no-store" bypasses the browser's HTTP cache (which would otherwise
  // honor our Cache-Control: max-age=30 and intercept refetches inside that
  // window, returning stale data without ever hitting the network).
  const res = await fetch("/api/live", { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/live returned ${res.status}`);
  return res.json();
}

// Poll cadence adapts to what's happening, so we don't hammer the endpoint
// when nothing is on: fast while a match is live, slower near kickoff, idle
// otherwise. The scoreboard itself tells us each match's state.
function pollInterval(data: HomeScoreboard | undefined): number {
  const matches = data?.matches ?? [];
  if (matches.some((m) => m.state === "in")) return 15_000;

  const now = Date.now();
  const kickoffSoon = matches.some((m) => {
    if (m.state !== "pre" || !m.date) return false;
    const delta = new Date(m.date).getTime() - now;
    return delta > 0 && delta < HOUR;
  });
  if (kickoffSoon) return 2 * 60_000;

  return 10 * 60_000;
}

export function useScoreboard() {
  return useQuery({
    queryKey: ["scoreboard"],
    queryFn: fetchLive,
    refetchInterval: (query) => pollInterval(query.state.data),
  });
}
