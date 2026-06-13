"use client";

import Link from "next/link";
import { useStats } from "@/hooks/useStats";
import type { PlayerStat, TeamGoalStat } from "@/lib/stats";

function Logo({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" />
  ) : (
    <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
  );
}

function GlanceCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
    </div>
  );
}

function ScorerRow({ rank, player }: { rank: number; player: PlayerStat }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-4 shrink-0 text-right font-mono text-xs text-zinc-400">
        {rank}
      </span>
      <Logo src={player.teamLogo} />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
        {player.name}
        <span className="ml-1.5 text-xs text-zinc-400">{player.teamAbbr}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {player.goals}
      </span>
    </li>
  );
}

function TeamRow({
  rank,
  team,
  value,
}: {
  rank: number;
  team: TeamGoalStat;
  value: number;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-4 shrink-0 text-right font-mono text-xs text-zinc-400">
        {rank}
      </span>
      <Logo src={team.logo} />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
        {team.name}
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
    </li>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {children}
      </ul>
    </div>
  );
}

export function HomeStats() {
  const { data } = useStats();

  // Stay quiet until there's something worth showing (pre-tournament, or while
  // the static asset is still loading) so the home page never shows empty cards.
  if (!data || data.matchesPlayed === 0) return null;

  const avg = (data.totalGoals / data.matchesPlayed).toFixed(2);
  const scorers = data.topScorers.slice(0, 5);
  const played = data.teamGoals.filter((t) => t.played > 0);
  const mostGoals = [...played]
    .sort((a, b) => b.goalsFor - a.goalsFor || b.goalDifference - a.goalDifference)
    .slice(0, 3);
  const bestDefense = [...played]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.goalDifference - a.goalDifference)
    .slice(0, 3);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tournament Stats
        </h2>
        <Link
          href="/stats"
          className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          All stats →
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <GlanceCard value={String(data.matchesPlayed)} label="Matches played" />
        <GlanceCard value={String(data.totalGoals)} label="Goals" />
        <GlanceCard value={avg} label="Goals / match" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {scorers.length > 0 && (
          <Card title="Top Scorers" hint="Goals">
            {scorers.map((p, i) => (
              <ScorerRow key={p.name + p.teamId} rank={i + 1} player={p} />
            ))}
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4">
          {mostGoals.length > 0 && (
            <Card title="Most Goals" hint="Scored">
              {mostGoals.map((t, i) => (
                <TeamRow key={t.teamId} rank={i + 1} team={t} value={t.goalsFor} />
              ))}
            </Card>
          )}
          {bestDefense.length > 0 && (
            <Card title="Best Defense" hint="Conceded">
              {bestDefense.map((t, i) => (
                <TeamRow
                  key={t.teamId}
                  rank={i + 1}
                  team={t}
                  value={t.goalsAgainst}
                />
              ))}
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
