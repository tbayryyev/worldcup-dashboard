import type { Metadata } from "next";
import { fetchTeams } from "@/lib/espn";
import { TeamsBrowser } from "@/components/TeamsBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "All 48 nations at the World Cup 2026 — squads, World Cup history, FIFA rankings and form.",
};

export default async function TeamsPage() {
  const teams = await fetchTeams();

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Teams
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            All {teams.length} nations at the 2026 World Cup. Star a team to pin
            it; tap for squad, history and form.
          </p>
        </header>

        {teams.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Teams couldn&apos;t be loaded right now.
            </p>
          </div>
        ) : (
          <TeamsBrowser teams={teams} />
        )}
      </main>
    </div>
  );
}
