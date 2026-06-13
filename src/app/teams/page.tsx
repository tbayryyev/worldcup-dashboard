import Link from "next/link";
import { fetchTeams } from "@/lib/espn";
import { teamHistory } from "@/lib/teamInfo";
import { fifaRanking } from "@/lib/fifaRanking";

export const dynamic = "force-dynamic";

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
            All {teams.length} nations at the 2026 World Cup. Tap a team for its
            squad, history and form.
          </p>
        </header>

        {teams.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Teams couldn&apos;t be loaded right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {teams.map((t) => {
              const h = teamHistory(t.id);
              const fr = fifaRanking(t.id);
              return (
                <Link
                  key={t.id}
                  href={`/teams/${t.id}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  {t.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.logo}
                      alt=""
                      className="h-9 w-9 shrink-0 object-contain"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {fr && <span>#{fr.rank} FIFA</span>}
                      {h && h.titles > 0 && (
                        <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-500">
                          {"★".repeat(h.titles)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
