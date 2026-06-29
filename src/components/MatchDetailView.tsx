"use client";

import { useState } from "react";
import Link from "next/link";
import { useMatchDetail } from "@/hooks/useMatchDetail";
import { LineupPitch } from "@/components/LineupPitch";
import { MatchEventToasts } from "@/components/MatchEventToasts";
import { PlayerStatsModal } from "@/components/PlayerStatsModal";
import {
  liveStatusLabel,
  type MatchDetail,
  type MatchEvent,
  type TeamSide,
  type TeamLineup,
  type LineupPlayer,
  type TeamStats,
} from "@/lib/espn";

// American odds → "+450" / "-135" / "—". ESPN sends moneylines as American odds.
function american(n: number | null): string {
  if (n === null) return "—";
  return n > 0 ? `+${n}` : String(n);
}

// American odds → implied win probability (incl. the bookmaker's margin).
function impliedPct(n: number | null): string | null {
  if (n === null) return null;
  const p = n > 0 ? 100 / (n + 100) : -n / (-n + 100);
  return `${Math.round(p * 100)}%`;
}

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
// `percent` adds a trailing %. `fraction` means ESPN sends the value as 0–1
// (e.g. passPct "0.9") so it must be ×100 for display — unlike possessionPct,
// which already arrives as 0–100.
const STAT_ROWS: {
  name: string;
  label: string;
  percent?: boolean;
  fraction?: boolean;
}[] = [
  { name: "possessionPct", label: "Possession", percent: true },
  { name: "totalShots", label: "Shots" },
  { name: "shotsOnTarget", label: "Shots on Target" },
  { name: "wonCorners", label: "Corners" },
  { name: "offsides", label: "Offsides" },
  { name: "foulsCommitted", label: "Fouls" },
  { name: "yellowCards", label: "Yellow Cards" },
  { name: "redCards", label: "Red Cards" },
  { name: "saves", label: "Saves" },
  { name: "passPct", label: "Pass Accuracy", percent: true, fraction: true },
];

function statValue(team: TeamStats | undefined, name: string): string | null {
  return team?.stats.find((s) => s.name === name)?.displayValue ?? null;
}

function StatRow({
  label,
  home,
  away,
  percent,
  fraction,
}: {
  label: string;
  home: string;
  away: string;
  percent?: boolean;
  fraction?: boolean;
}) {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a;
  const homePct = total > 0 ? (h / total) * 100 : 50;
  const suffix = percent ? "%" : "";
  // ESPN sends some percentages as 0–1; scale those to 0–100 for display.
  const fmt = (v: string) => {
    if (!fraction) return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? String(Math.round(n * 100)) : v;
  };
  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        <span>
          {fmt(home)}
          {suffix}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <span>
          {fmt(away)}
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
            fraction={r.fraction}
          />
        ))}
      </div>
    </section>
  );
}

function LineupColumn({
  lineup,
  showSubs,
  onSelect,
}: {
  lineup: TeamLineup;
  showSubs: boolean;
  onSelect: (player: LineupPlayer) => void;
}) {
  return (
    <div>
      {lineup.formation && (
        <div className="mb-2 text-xs font-medium text-zinc-400">
          {lineup.formation}
        </div>
      )}
      <LineupPitch lineup={lineup} showSubs={showSubs} onSelect={onSelect} />
      {lineup.subs.length > 0 && (
        <>
          <div className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Substitutes
          </div>
          <ul className="space-y-1">
            {lineup.subs.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className="-mx-1 flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-400">
                    {p.jersey}
                  </span>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {p.name}
                  </span>
                  {showSubs && p.subbedIn && (
                    <span
                      className="text-xs text-emerald-600 dark:text-emerald-500"
                      title="Substituted on"
                    >
                      ▲
                    </span>
                  )}
                  {p.position && (
                    <span className="text-xs text-zinc-400">{p.position}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Lineups({ match }: { match: MatchDetail }) {
  const [selected, setSelected] = useState<{
    player: LineupPlayer;
    teamName: string;
  } | null>(null);
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
      <p className="mb-3 -mt-1 text-xs text-zinc-400">
        Tap a player for their match stats.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {match.home.name}
          </h3>
          {home && (
            <LineupColumn
              lineup={home}
              showSubs={showSubs}
              onSelect={(player) =>
                setSelected({ player, teamName: match.home.name })
              }
            />
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {match.away.name}
          </h3>
          {away && (
            <LineupColumn
              lineup={away}
              showSubs={showSubs}
              onSelect={(player) =>
                setSelected({ player, teamName: match.away.name })
              }
            />
          )}
        </div>
      </div>

      <PlayerStatsModal
        player={selected?.player ?? null}
        teamName={selected?.teamName ?? ""}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}

function MoneylineCell({
  label,
  odds,
  favorite,
}: {
  label: string;
  odds: number | null;
  favorite?: boolean;
}) {
  const pct = impliedPct(odds);
  return (
    <div
      className={`flex flex-col items-center rounded-lg border px-2 py-3 text-center ${
        favorite
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <span className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="mt-1 text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {american(odds)}
      </span>
      {pct && <span className="text-[10px] text-zinc-400">{pct}</span>}
    </div>
  );
}

function Odds({ match }: { match: MatchDetail }) {
  const o = match.odds;
  if (!o) return null;
  const ou = o.overUnder;
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <span>Betting Odds</span>
        {o.provider && (
          <span className="text-[11px] font-normal normal-case text-zinc-400">
            via {o.provider}
          </span>
        )}
      </h2>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {/* 3-way moneyline */}
        <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          Moneyline
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <MoneylineCell
            label={match.home.abbreviation || "Home"}
            odds={o.home.moneyLine}
            favorite={o.home.favorite}
          />
          <MoneylineCell label="Draw" odds={o.drawMoneyLine} />
          <MoneylineCell
            label={match.away.abbreviation || "Away"}
            odds={o.away.moneyLine}
            favorite={o.away.favorite}
          />
        </div>

        {/* Over/under + spread */}
        {(ou !== null || o.details) && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ou !== null && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Total goals · O/U {ou}
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Over{" "}
                    <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {american(o.overOdds)}
                    </span>
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Under{" "}
                    <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {american(o.underOdds)}
                    </span>
                  </span>
                </div>
              </div>
            )}
            {o.details && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Spread
                </div>
                <div className="mt-1.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {o.details}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-[11px] text-zinc-400">
          Odds shown for informational purposes and may be delayed. Percentages
          are implied probabilities including the bookmaker margin.
        </p>
      </div>
    </section>
  );
}

function MatchInfoBar({ match }: { match: MatchDetail }) {
  const bits: { label: string; value: string }[] = [];
  if (match.venue) {
    const loc = [match.venue.city, match.venue.country].filter(Boolean).join(", ");
    bits.push({
      label: "Venue",
      value: match.venue.name + (loc ? ` · ${loc}` : ""),
    });
  }
  if (match.referee) bits.push({ label: "Referee", value: match.referee });
  if (match.attendance != null)
    bits.push({ label: "Attendance", value: match.attendance.toLocaleString() });
  if (bits.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-900">
      {bits.map((b, i) => (
        <span key={i}>
          <span className="text-zinc-400">{b.label}:</span>{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {b.value}
          </span>
        </span>
      ))}
    </div>
  );
}

function Leaders({ match }: { match: MatchDetail }) {
  if (match.leaders.length === 0) return null;
  const cols = [
    { tl: match.leaders.find((l) => l.teamId === match.home.id), name: match.home.name },
    { tl: match.leaders.find((l) => l.teamId === match.away.id), name: match.away.name },
  ].filter((c) => c.tl);
  if (cols.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Top Performers
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cols.map((c) => (
          <div key={c.name}>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {c.name}
            </h3>
            <ul className="space-y-1.5">
              {c.tl!.items.map((it, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0 text-xs text-zinc-400">
                    {it.category}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-200">
                    {it.player}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {it.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeadToHead({ match }: { match: MatchDetail }) {
  if (match.headToHead.length === 0) return null;
  const sideFor = (id: string): TeamSide | null =>
    id === match.home.id ? match.home : id === match.away.id ? match.away : null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Head-to-Head
      </h2>
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {match.headToHead.slice(0, 8).map((g, i) => {
          const h = sideFor(g.homeTeamId);
          const a = sideFor(g.awayTeamId);
          const year = g.date ? new Date(g.date).getFullYear() : "";
          return (
            <li key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="w-10 shrink-0 text-xs text-zinc-400">{year}</span>
              <span className="ml-auto truncate text-right text-zinc-700 dark:text-zinc-300">
                {h?.abbreviation || "—"}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {g.homeScore}–{g.awayScore}
              </span>
              <span className="w-16 shrink-0 truncate text-zinc-700 dark:text-zinc-300">
                {a?.abbreviation || "—"}
              </span>
              {g.competition && (
                <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
                  {g.competition}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Commentary({ match }: { match: MatchDetail }) {
  const [all, setAll] = useState(false);
  if (match.commentary.length === 0) return null;
  const items = [...match.commentary].reverse(); // newest first
  const shown = all ? items : items.slice(0, 12);
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Commentary
      </h2>
      <ul className="space-y-2.5">
        {shown.map((c, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="w-10 shrink-0 font-mono text-xs text-zinc-400">
              {c.clock}
            </span>
            <span className="text-zinc-700 dark:text-zinc-300">{c.text}</span>
          </li>
        ))}
      </ul>
      {items.length > 12 && (
        <button
          onClick={() => setAll((v) => !v)}
          className="mt-3 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {all ? "Show less" : `Show all ${items.length} entries`}
        </button>
      )}
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
      <MatchEventToasts match={match} />
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

        <MatchInfoBar match={match} />
        <Odds match={match} />
        <MatchEvents match={match} />
        <MatchStats match={match} />
        <Leaders match={match} />
        <Lineups match={match} />
        <HeadToHead match={match} />
        <Commentary match={match} />
      </main>
    </div>
  );
}
