"use client";

import Link from "next/link";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { LineupPitch } from "@/components/LineupPitch";
import {
  liveStatusLabel,
  type MatchDetail,
  type MatchEvent,
  type TeamSide,
  type TeamLineup,
  type TeamStats,
} from "@/lib/espn";

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
        {match.state === "in" ? liveStatusLabel(match) : match.statusDetail}
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: MatchEvent["type"] }) {
  switch (type) {
    case "goal":
      return <span aria-label="Goal" title="Goal">⚽</span>;
    case "yellow":
      return (
        <span
          aria-label="Yellow card"
          title="Yellow card"
          className="inline-block h-3.5 w-2.5 rounded-[2px] bg-yellow-400"
        />
      );
    case "red":
      return (
        <span
          aria-label="Red card"
          title="Red card"
          className="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-600"
        />
      );
    case "sub":
      return (
        <span aria-label="Substitution" title="Substitution" className="text-emerald-600 dark:text-emerald-500">
          ⇄
        </span>
      );
    default:
      return null;
  }
}

function EventDescription({ ev }: { ev: MatchEvent }) {
  if (ev.type === "goal") {
    return (
      <span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {ev.scorer ?? "Goal"}
        </span>
        {ev.penalty && <span className="ml-1 text-xs text-zinc-400">(pen)</span>}
        {ev.ownGoal && <span className="ml-1 text-xs text-zinc-400">(OG)</span>}
        {ev.assist && (
          <span className="ml-1 text-zinc-500 dark:text-zinc-400">
            · assist {ev.assist}
          </span>
        )}
      </span>
    );
  }
  if (ev.type === "sub") {
    return (
      <span>
        <span className="text-emerald-600 dark:text-emerald-500">▲ </span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {ev.playerIn ?? "—"}
        </span>
        <span className="text-zinc-400"> ▼ {ev.playerOut ?? "—"}</span>
      </span>
    );
  }
  // cards
  return (
    <span className="font-medium text-zinc-900 dark:text-zinc-100">
      {ev.player ?? ev.text}
    </span>
  );
}

function MatchEvents({ match }: { match: MatchDetail }) {
  if (match.events.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Timeline
      </h2>
      <ul className="space-y-2">
        {match.events.map((ev, i) => {
          const side =
            ev.teamId === match.home.id
              ? match.home.abbreviation
              : ev.teamId === match.away.id
                ? match.away.abbreviation
                : "";
          return (
            <li
              key={i}
              className="flex items-center gap-3 text-sm text-zinc-800 dark:text-zinc-200"
            >
              <span className="w-10 shrink-0 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {ev.clock}
              </span>
              <span className="flex w-4 shrink-0 justify-center">
                <EventIcon type={ev.type} />
              </span>
              <EventDescription ev={ev} />
              {side && (
                <span className="ml-auto shrink-0 text-xs font-semibold text-zinc-400">
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

// Curated, ordered subset of ESPN's ~28 team stats — the ones fans actually
// scan. Each entry maps an ESPN stat `name` to a display label; `percent`
// stats render with a trailing %.
const STAT_ROWS: { name: string; label: string; percent?: boolean }[] = [
  { name: "possessionPct", label: "Possession", percent: true },
  { name: "totalShots", label: "Shots" },
  { name: "shotsOnTarget", label: "Shots on Target" },
  { name: "wonCorners", label: "Corners" },
  { name: "offsides", label: "Offsides" },
  { name: "foulsCommitted", label: "Fouls" },
  { name: "yellowCards", label: "Yellow Cards" },
  { name: "redCards", label: "Red Cards" },
  { name: "saves", label: "Saves" },
  { name: "passPct", label: "Pass Accuracy", percent: true },
];

function statValue(team: TeamStats | undefined, name: string): string | null {
  return team?.stats.find((s) => s.name === name)?.displayValue ?? null;
}

function StatRow({
  label,
  home,
  away,
  percent,
}: {
  label: string;
  home: string;
  away: string;
  percent?: boolean;
}) {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a;
  const homePct = total > 0 ? (h / total) * 100 : 50;
  const suffix = percent ? "%" : "";
  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        <span>
          {home}
          {suffix}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <span>
          {away}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="bg-sky-500"
          style={{ width: `${homePct}%` }}
        />
        <div className="flex-1 bg-orange-500" />
      </div>
    </div>
  );
}

function MatchStats({ match }: { match: MatchDetail }) {
  const home = match.teamStats.find((t) => t.homeAway === "home");
  const away = match.teamStats.find((t) => t.homeAway === "away");
  if (!home && !away) return null;

  const rows = STAT_ROWS.map((r) => {
    const h = statValue(home, r.name);
    const a = statValue(away, r.name);
    if (h == null && a == null) return null;
    return { ...r, home: h ?? "0", away: a ?? "0" };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Match Stats
        </h2>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
            {match.home.abbreviation}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
            {match.away.abbreviation}
          </span>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-1 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((r) => (
          <StatRow
            key={r.name}
            label={r.label}
            home={r.home}
            away={r.away}
            percent={r.percent}
          />
        ))}
      </div>
    </section>
  );
}

function PlayerRow({
  jersey,
  name,
  position,
  subbedOut,
  subbedIn,
}: {
  jersey: string;
  name: string;
  position?: string;
  subbedOut?: boolean;
  subbedIn?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-400">
        {jersey}
      </span>
      <span className="text-zinc-800 dark:text-zinc-200">{name}</span>
      {subbedOut && (
        <span className="text-xs text-red-500" title="Substituted off">
          ▼
        </span>
      )}
      {subbedIn && (
        <span className="text-xs text-emerald-600 dark:text-emerald-500" title="Substituted on">
          ▲
        </span>
      )}
      {position && <span className="text-xs text-zinc-400">{position}</span>}
    </li>
  );
}

function LineupColumn({
  lineup,
  showSubs,
}: {
  lineup: TeamLineup;
  showSubs: boolean;
}) {
  return (
    <div>
      {lineup.formation && (
        <div className="mb-2 text-xs font-medium text-zinc-400">
          {lineup.formation}
        </div>
      )}
      <LineupPitch lineup={lineup} showSubs={showSubs} />
      {lineup.subs.length > 0 && (
        <>
          <div className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Substitutes
          </div>
          <ul className="space-y-1">
            {lineup.subs.map((p, i) => (
              <PlayerRow
                key={i}
                jersey={p.jersey}
                name={p.name}
                position={p.position}
                subbedIn={showSubs && p.subbedIn}
              />
            ))}
          </ul>
        </>
      )}
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
  // Sub arrows only make sense once the match is under way; pre-match they'd be
  // stale/meaningless noise next to every name.
  const showSubs = match.state !== "pre";
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Lineups
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {match.home.name}
          </h3>
          {home && <LineupColumn lineup={home} showSubs={showSubs} />}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {match.away.name}
          </h3>
          {away && <LineupColumn lineup={away} showSubs={showSubs} />}
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

        <MatchEvents match={match} />
        <MatchStats match={match} />
        <Lineups match={match} />
      </main>
    </div>
  );
}
