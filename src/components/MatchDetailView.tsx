"use client";

import Link from "next/link";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import type { MatchDetail, TeamSide, TeamLineup } from "@/lib/espn";

function formatTime(ms: number | undefined): string {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function TeamBadge({ team }: { team: TeamSide }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt="" className="h-16 w-16 object-contain" />
      ) : (
        <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      )}
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {team.name}
      </span>
    </div>
  );
}

function Scoreline({ match }: { match: MatchDetail }) {
  if (match.state === "pre") {
    const when = match.date
      ? new Date(match.date).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "TBD";
    return (
      <div className="text-center">
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {when}
        </div>
      </div>
    );
  }
  return (
    <div className="text-center">
      <div className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {match.home.score ?? 0}
        <span className="mx-2 text-zinc-300 dark:text-zinc-600">–</span>
        {match.away.score ?? 0}
      </div>
      <div
        className={`mt-1 text-xs font-semibold uppercase tracking-wide ${
          match.state === "in"
            ? "text-red-600 dark:text-red-500"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {match.state === "in" ? match.clock || "LIVE" : match.statusDetail}
      </div>
    </div>
  );
}

function GoalTimeline({ match }: { match: MatchDetail }) {
  if (match.goals.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Goals
      </h2>
      <ul className="space-y-1.5">
        {match.goals.map((g, i) => {
          const side =
            g.teamId === match.home.id
              ? match.home.abbreviation
              : g.teamId === match.away.id
                ? match.away.abbreviation
                : "";
          return (
            <li
              key={i}
              className="flex items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200"
            >
              <span className="w-10 shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
                {g.clock}
              </span>
              <span className="font-medium">{g.scorer ?? "Goal"}</span>
              {g.penalty && <span className="text-xs text-zinc-400">(pen)</span>}
              {g.ownGoal && <span className="text-xs text-zinc-400">(OG)</span>}
              {side && (
                <span className="ml-auto text-xs font-semibold text-zinc-400">
                  {side}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LineupColumn({ lineup }: { lineup: TeamLineup }) {
  return (
    <div>
      {lineup.formation && (
        <div className="mb-2 text-xs font-medium text-zinc-400">
          {lineup.formation}
        </div>
      )}
      <ul className="space-y-1">
        {lineup.starters.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-400">
              {p.jersey}
            </span>
            <span className="text-zinc-800 dark:text-zinc-200">{p.name}</span>
            <span className="text-xs text-zinc-400">{p.position}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lineups({ match }: { match: MatchDetail }) {
  const hasStarters = match.lineups.some((l) => l.starters.length > 0);
  if (!hasStarters) {
    return (
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Lineups
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Lineups will be available closer to kickoff.
        </p>
      </section>
    );
  }
  const home = match.lineups.find((l) => l.homeAway === "home");
  const away = match.lineups.find((l) => l.homeAway === "away");
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Starting XI
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {match.home.name}
          </h3>
          {home && <LineupColumn lineup={home} />}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {match.away.name}
          </h3>
          {away && <LineupColumn lineup={away} />}
        </div>
      </div>
    </section>
  );
}

export function MatchDetailView({
  id,
  initialData,
}: {
  id: string;
  initialData: MatchDetail;
}) {
  // Seeded with the server-rendered snapshot, then polls for live updates.
  const { data: match, isFetching, dataUpdatedAt } = useMatchDetail(
    id,
    initialData,
  );

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isFetching
                  ? "animate-pulse bg-green-500"
                  : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
            Updated {formatTime(dataUpdatedAt)}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 items-center rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <TeamBadge team={match.home} />
          <Scoreline match={match} />
          <TeamBadge team={match.away} />
        </div>

        <GoalTimeline match={match} />
        <Lineups match={match} />
      </main>
    </div>
  );
}
