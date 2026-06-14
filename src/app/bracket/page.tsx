import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllFixtures } from "@/lib/espn";
import type { Match, TeamSide } from "@/lib/espn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bracket",
  description: "The FIFA World Cup 2026 knockout bracket — Round of 32 to the Final.",
};

const ROUNDS: { slug: string; label: string }[] = [
  { slug: "round-of-32", label: "Round of 32" },
  { slug: "round-of-16", label: "Round of 16" },
  { slug: "quarterfinals", label: "Quarterfinals" },
  { slug: "semifinals", label: "Semifinals" },
  { slug: "3rd-place-match", label: "Third place" },
  { slug: "final", label: "Final" },
];

function shortDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function BracketTeam({
  team,
  state,
  won,
}: {
  team: TeamSide;
  state: Match["state"];
  won: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt="" className="h-4 w-4 shrink-0 object-contain" />
      ) : (
        <div className="h-4 w-4 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      )}
      <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-200">
        {team.name}
      </span>
      {state !== "pre" && (
        <span
          className={`shrink-0 tabular-nums ${
            won ? "font-bold text-zinc-900 dark:text-zinc-50" : "text-zinc-500"
          }`}
        >
          {team.score ?? 0}
        </span>
      )}
    </div>
  );
}

function BracketMatch({ match }: { match: Match }) {
  const label =
    match.state === "post"
      ? match.statusDetail || "FT"
      : match.state === "in"
        ? "LIVE"
        : shortDate(match.date);
  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-2 text-xs shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div
        className={`mb-1 text-[10px] font-medium uppercase tracking-wide ${
          match.state === "in" ? "text-red-500" : "text-zinc-400"
        }`}
      >
        {label}
      </div>
      <div className="space-y-1">
        <BracketTeam
          team={match.home}
          state={match.state}
          won={(match.home.score ?? 0) > (match.away.score ?? 0)}
        />
        <BracketTeam
          team={match.away}
          state={match.state}
          won={(match.away.score ?? 0) > (match.home.score ?? 0)}
        />
      </div>
    </Link>
  );
}

export default async function BracketPage() {
  const data = await fetchAllFixtures().catch(() => null);
  const matches = data?.matches ?? [];
  const columns = ROUNDS.map((r) => ({
    ...r,
    matches: matches.filter((m) => m.round === r.slug),
  })).filter((c) => c.matches.length > 0);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Knockout Bracket
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Round of 32 through the Final. Matchups fill in as teams advance.
          </p>
        </header>

        {columns.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              The bracket appears once the knockout stage is scheduled.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <div key={col.slug} className="flex w-48 shrink-0 flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {col.label}
                </h2>
                {col.matches.map((m) => (
                  <BracketMatch key={m.id} match={m} />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
