import type { Metadata } from "next";
import { fetchStandings } from "@/lib/espn";
import type { StandingsGroup, StandingsEntry } from "@/lib/espn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Standings",
  description: "Group-stage standings for the FIFA World Cup 2026 — all 12 groups.",
};

function GroupTable({ group }: { group: StandingsGroup }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        {group.name}
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-400">
            <th className="w-6 font-medium">#</th>
            <th className="font-medium">Team</th>
            <th className="w-8 text-center font-medium">P</th>
            <th className="w-8 text-center font-medium">W</th>
            <th className="w-8 text-center font-medium">D</th>
            <th className="w-8 text-center font-medium">L</th>
            <th className="w-10 text-center font-medium">GD</th>
            <th className="w-8 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.entries.map((e) => (
            <Row key={e.team.id} entry={e} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Row({ entry }: { entry: StandingsEntry }) {
  const gd =
    entry.goalDifference > 0
      ? `+${entry.goalDifference}`
      : String(entry.goalDifference);
  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800">
      <td className="py-2 text-xs text-zinc-400">{entry.rank}</td>
      <td className="py-2">
        <div className="flex items-center gap-2 min-w-0">
          {entry.team.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.team.logo}
              alt=""
              className="h-5 w-5 shrink-0 object-contain"
            />
          ) : (
            <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          )}
          <span className="truncate text-zinc-900 dark:text-zinc-100">
            {entry.team.name}
          </span>
        </div>
      </td>
      <td className="text-center tabular-nums text-zinc-600 dark:text-zinc-300">
        {entry.gamesPlayed}
      </td>
      <td className="text-center tabular-nums text-zinc-600 dark:text-zinc-300">
        {entry.wins}
      </td>
      <td className="text-center tabular-nums text-zinc-600 dark:text-zinc-300">
        {entry.draws}
      </td>
      <td className="text-center tabular-nums text-zinc-600 dark:text-zinc-300">
        {entry.losses}
      </td>
      <td className="text-center tabular-nums text-zinc-600 dark:text-zinc-300">
        {gd}
      </td>
      <td className="text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {entry.points}
      </td>
    </tr>
  );
}

export default async function StandingsPage() {
  const data = await fetchStandings();

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Group Stage
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Standings update after each match.
          </p>
        </header>

        {data.groups.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Group standings will appear once the tournament begins.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.groups.map((g) => (
              <GroupTable key={g.id} group={g} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
