import Link from "next/link";
import { liveStatusLabel, type Match, type TeamSide } from "@/lib/espn";

function kickoffLabel(iso: string): string {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ match }: { match: Match }) {
  if (match.state === "in") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
        </span>
        {liveStatusLabel(match)}
      </span>
    );
  }
  if (match.state === "post") {
    return (
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {match.statusDetail || "Full Time"}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {kickoffLabel(match.date)}
    </span>
  );
}

function TeamRow({ team, state }: { team: TeamSide; state: Match["state"] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logo}
            alt=""
            className="h-7 w-7 shrink-0 object-contain"
          />
        ) : (
          <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        )}
        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {team.name}
        </span>
      </div>
      {state === "pre" ? null : (
        <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {team.score ?? 0}
        </span>
      )}
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge match={match} />
      </div>
      <div className="space-y-2">
        <TeamRow team={match.home} state={match.state} />
        <TeamRow team={match.away} state={match.state} />
      </div>
    </Link>
  );
}
