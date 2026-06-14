"use client";

import { useScoreboard } from "@/hooks/useScoreboard";
import { MatchCard } from "@/components/MatchCard";

function formatTime(ms: number | undefined): string {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LiveScores() {
  const { data, isPending, isError, isFetching, refetch, dataUpdatedAt } =
    useScoreboard();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          Couldn&apos;t load live scores.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-md bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const matches = data.matches;
  const liveCount = matches.filter((m) => m.state === "in").length;

  // Title reflects what the API gave us: today's slate, or the next matchday.
  let heading = "Upcoming Matches";
  if (data.scope === "today") {
    heading = "Today's Matches";
  } else if (data.scope === "upcoming" && matches[0]?.date) {
    const day = new Date(matches[0].date).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    heading = `Upcoming Matches · ${day}`;
  }

  return (
    <div>
      {liveCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
          </span>
          {liveCount} {liveCount === 1 ? "match" : "matches"} live now
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {heading}
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isFetching ? "animate-pulse bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          />
          Updated {formatTime(dataUpdatedAt)}
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No matches scheduled right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
