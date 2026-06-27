"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import { teamHistory } from "@/lib/teamInfo";
import { fifaRanking } from "@/lib/fifaRanking";
import type { TeamListItem } from "@/lib/espn";

type SortKey = "alpha" | "fifa" | "titles";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "alpha", label: "A–Z" },
  { key: "fifa", label: "FIFA Rank" },
  { key: "titles", label: "Titles" },
];

// Comparator per sort mode. FIFA rank sorts best-first (unranked teams last);
// titles sorts most-first, breaking ties by FIFA rank then name so the order is
// always stable.
function comparator(key: SortKey) {
  const rankOf = (t: TeamListItem) => fifaRanking(t.id)?.rank ?? Infinity;
  return (a: TeamListItem, b: TeamListItem) => {
    if (key === "alpha") return a.name.localeCompare(b.name);
    if (key === "fifa") return rankOf(a) - rankOf(b) || a.name.localeCompare(b.name);
    const ta = teamHistory(a.id)?.titles ?? 0;
    const tb = teamHistory(b.id)?.titles ?? 0;
    return tb - ta || rankOf(a) - rankOf(b) || a.name.localeCompare(b.name);
  };
}

function TeamCard({ team }: { team: TeamListItem }) {
  const h = teamHistory(team.id);
  const fr = fifaRanking(team.id);
  return (
    <div className="relative">
      <Link
        href={`/teams/${team.id}`}
        className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 pr-9 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      >
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {team.name}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            {fr && <span>#{fr.rank} FIFA</span>}
            {h && h.titles > 0 && (
              <span className="font-medium text-amber-600 dark:text-amber-500">
                {"★".repeat(h.titles)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <FavoriteButton
        teamId={team.id}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2"
      />
    </div>
  );
}

export function TeamsBrowser({ teams }: { teams: TeamListItem[] }) {
  const { favs, ready } = useFavorites();
  const [sort, setSort] = useState<SortKey>("alpha");

  const sorted = useMemo(
    () => [...teams].sort(comparator(sort)),
    [teams, sort],
  );
  const favTeams = ready ? sorted.filter((t) => favs.includes(t.id)) : [];

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Sort by
        </span>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
          {SORTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                sort === key
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {favTeams.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span className="text-amber-400">★</span> Your Teams
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {favTeams.map((t) => (
              <TeamCard key={t.id} team={t} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((t) => (
          <TeamCard key={t.id} team={t} />
        ))}
      </div>
    </>
  );
}
