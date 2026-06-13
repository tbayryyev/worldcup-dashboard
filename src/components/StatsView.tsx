"use client";

import { useState } from "react";
import { useStats } from "@/hooks/useStats";
import type {
  StatsData,
  PlayerStat,
  PlayerDiscipline,
  TeamGoalStat,
  TeamPassingStat,
  TeamDiscipline,
} from "@/lib/stats";

type Tab = "scorers" | "assists" | "teams" | "discipline";

const TABS: { id: Tab; label: string }[] = [
  { id: "scorers", label: "Scorers" },
  { id: "assists", label: "Assists" },
  { id: "teams", label: "Teams" },
  { id: "discipline", label: "Discipline" },
];

function Logo({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-5 w-5 shrink-0 object-contain" />
  ) : (
    <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
  );
}

function Row({
  rank,
  logo,
  primary,
  secondary,
  value,
}: {
  rank: number;
  logo: string | null;
  primary: string;
  secondary?: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="w-5 shrink-0 text-right font-mono text-xs text-zinc-400">
        {rank}
      </span>
      <Logo src={logo} />
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200">
        {primary}
        {secondary && (
          <span className="ml-1.5 text-xs text-zinc-400">{secondary}</span>
        )}
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

function Empty({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
    </div>
  );
}

function ScorersTab({ players }: { players: PlayerStat[] }) {
  if (players.length === 0) return <Empty>No goals scored yet.</Empty>;
  return (
    <Card title="Top Scorers" hint="Goals">
      {players.map((p, i) => (
        <Row
          key={p.name + p.teamId}
          rank={i + 1}
          logo={p.teamLogo}
          primary={p.name}
          secondary={p.teamAbbr}
          value={
            <>
              {p.goals}
              {p.assists > 0 && (
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  ({p.assists}A)
                </span>
              )}
            </>
          }
        />
      ))}
    </Card>
  );
}

function AssistsTab({ players }: { players: PlayerStat[] }) {
  if (players.length === 0) return <Empty>No assists recorded yet.</Empty>;
  return (
    <Card title="Top Assisters" hint="Assists">
      {players.map((p, i) => (
        <Row
          key={p.name + p.teamId}
          rank={i + 1}
          logo={p.teamLogo}
          primary={p.name}
          secondary={p.teamAbbr}
          value={p.assists}
        />
      ))}
    </Card>
  );
}

function gd(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function TeamsTab({
  goals,
  passing,
}: {
  goals: TeamGoalStat[];
  passing: TeamPassingStat[];
}) {
  const played = goals.filter((t) => t.played > 0);
  if (played.length === 0) return <Empty>Team stats appear after the first matches.</Empty>;

  const mostGoals = [...played]
    .sort((a, b) => b.goalsFor - a.goalsFor || b.goalDifference - a.goalDifference)
    .slice(0, 8);
  const fewestConceded = [...played]
    .sort((a, b) => a.goalsAgainst - b.goalsAgainst || b.goalDifference - a.goalDifference)
    .slice(0, 8);
  const mostConceded = [...played]
    .sort((a, b) => b.goalsAgainst - a.goalsAgainst)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card title="Most Goals" hint="GF (GD)">
        {mostGoals.map((t, i) => (
          <Row
            key={t.teamId}
            rank={i + 1}
            logo={t.logo}
            primary={t.name}
            value={
              <>
                {t.goalsFor}
                <span className="ml-1 text-xs font-normal text-zinc-400">
                  {gd(t.goalDifference)}
                </span>
              </>
            }
          />
        ))}
      </Card>
      <Card title="Best Defense" hint="Conceded">
        {fewestConceded.map((t, i) => (
          <Row key={t.teamId} rank={i + 1} logo={t.logo} primary={t.name} value={t.goalsAgainst} />
        ))}
      </Card>
      <Card title="Most Conceded" hint="Goals against">
        {mostConceded.map((t, i) => (
          <Row key={t.teamId} rank={i + 1} logo={t.logo} primary={t.name} value={t.goalsAgainst} />
        ))}
      </Card>
      <Card title="Best Passing" hint="Accuracy">
        {passing.length === 0 ? (
          <li className="py-2 text-sm text-zinc-400">No passing data yet.</li>
        ) : (
          passing.slice(0, 8).map((t, i) => (
            <Row
              key={t.teamId}
              rank={i + 1}
              logo={t.logo}
              primary={t.name}
              secondary={`${t.matches}m`}
              value={`${t.passPct}%`}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function cardsValue(yellow: number, red: number): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5">
      {red > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <span className="inline-block h-3 w-2 rounded-[2px] bg-red-600" />
          {red}
        </span>
      )}
      <span className="inline-flex items-center gap-0.5">
        <span className="inline-block h-3 w-2 rounded-[2px] bg-yellow-400" />
        {yellow}
      </span>
    </span>
  );
}

function DisciplineTab({
  players,
  teams,
}: {
  players: PlayerDiscipline[];
  teams: TeamDiscipline[];
}) {
  if (players.length === 0 && teams.length === 0)
    return <Empty>No cards shown yet.</Empty>;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card title="Players — Most Cards" hint="R / Y">
        {players.length === 0 ? (
          <li className="py-2 text-sm text-zinc-400">No cards yet.</li>
        ) : (
          players.map((p, i) => (
            <Row
              key={p.name + p.teamId}
              rank={i + 1}
              logo={p.teamLogo}
              primary={p.name}
              secondary={p.teamAbbr}
              value={cardsValue(p.yellow, p.red)}
            />
          ))
        )}
      </Card>
      <Card title="Teams — Most Cards" hint="R / Y">
        {teams.length === 0 ? (
          <li className="py-2 text-sm text-zinc-400">No cards yet.</li>
        ) : (
          teams.map((t, i) => (
            <Row
              key={t.teamId}
              rank={i + 1}
              logo={t.logo}
              primary={t.name}
              value={cardsValue(t.yellow, t.red)}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function Glance({ data }: { data: StatsData }) {
  const avg =
    data.matchesPlayed > 0
      ? (data.totalGoals / data.matchesPlayed).toFixed(2)
      : "—";
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {[
        { label: "Matches played", value: String(data.matchesPlayed) },
        { label: "Goals", value: String(data.totalGoals) },
        { label: "Goals / match", value: avg },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {s.value}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsView() {
  const [tab, setTab] = useState<Tab>("scorers");
  const { data, isPending, isError } = useStats();

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Stats
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tournament leaders, refreshed periodically as matches finish.
          </p>
        </header>

        {isPending ? (
          <div className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        ) : isError || !data ? (
          <Empty>Stats aren&apos;t available yet — check back once matches are played.</Empty>
        ) : (
          <>
            <Glance data={data} />

            <div className="mb-5 flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    tab === t.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "scorers" && <ScorersTab players={data.topScorers} />}
            {tab === "assists" && <AssistsTab players={data.topAssisters} />}
            {tab === "teams" && (
              <TeamsTab goals={data.teamGoals} passing={data.teamPassing} />
            )}
            {tab === "discipline" && (
              <DisciplineTab
                players={data.playerDiscipline}
                teams={data.teamDiscipline}
              />
            )}

            <p className="mt-6 text-xs text-zinc-400">
              Updated {new Date(data.generatedAt).toLocaleString()}. Player
              leaders are aggregated from match data; team goals come from the
              standings.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
