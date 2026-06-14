import Link from "next/link";
import type {
  TeamProfile,
  SquadPlayer,
  TeamFormMatch,
} from "@/lib/espn";
import type { TeamHistory } from "@/lib/teamInfo";
import type { FifaRanking } from "@/lib/fifaRanking";
import { FavoriteButton } from "@/components/FavoriteButton";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function matchDate(iso: string): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {sub}
        </div>
      )}
    </div>
  );
}

function FormPill({ result }: { result: "W" | "D" | "L" }) {
  const cls =
    result === "W"
      ? "bg-emerald-500 text-white"
      : result === "L"
        ? "bg-red-500 text-white"
        : "bg-zinc-400 text-white dark:bg-zinc-600";
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${cls}`}
    >
      {result}
    </span>
  );
}

function History({
  history,
  ranking,
}: {
  history: TeamHistory | null;
  ranking: FifaRanking | null;
}) {
  if (!history && !ranking) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        World Cup History
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Titles"
          value={history && history.titles > 0 ? `${history.titles} ★` : "—"}
        />
        <StatCard
          label="Appearances"
          value={history ? String(history.appearances) : "—"}
        />
        <StatCard
          label="FIFA Rank"
          value={ranking ? `#${ranking.rank}` : "—"}
          sub={ranking ? `${ranking.points.toFixed(2)} pts` : undefined}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Best finish"
            value=""
            sub={history?.bestFinish ?? "—"}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        World Cup totals and FIFA ranking are curated reference data, updated
        from the latest published ranking.
      </p>
    </section>
  );
}

function AgeProfileSection({ profile }: { profile: TeamProfile }) {
  const a = profile.ageProfile;
  if (a.squadSize === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Squad Age Profile
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Avg age"
          value={a.average != null ? a.average.toFixed(1) : "—"}
        />
        <StatCard label="Squad size" value={String(a.squadSize)} />
        <StatCard label="Under 23" value={String(a.under23)} sub="players" />
        <StatCard
          label="Youngest"
          value={a.youngest ? String(a.youngest.age) : "—"}
          sub={a.youngest?.name}
        />
        <StatCard
          label="Oldest"
          value={a.oldest ? String(a.oldest.age) : "—"}
          sub={a.oldest?.name}
        />
      </div>
    </section>
  );
}

function FormRow({ m }: { m: TeamFormMatch }) {
  return (
    <Link
      href={`/match/${m.matchId}`}
      className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <FormPill result={m.result} />
      <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {m.scoreFor}–{m.scoreAgainst}
      </span>
      <span className="truncate text-zinc-600 dark:text-zinc-300">
        vs {m.opponent}
      </span>
    </Link>
  );
}

function FormSection({ profile }: { profile: TeamProfile }) {
  if (profile.recentForm.length === 0 && !profile.nextMatch) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Form &amp; Fixtures
      </h2>
      {profile.recentForm.length > 0 && (
        <div className="mb-4 flex items-center gap-1.5">
          {/* oldest → newest reads left to right */}
          {[...profile.recentForm].reverse().map((m) => (
            <FormPill key={m.matchId} result={m.result} />
          ))}
          <span className="ml-2 text-xs text-zinc-400">recent results</span>
        </div>
      )}
      <div className="space-y-2">
        {profile.recentForm.map((m) => (
          <FormRow key={m.matchId} m={m} />
        ))}
      </div>
      {profile.nextMatch && (
        <Link
          href={`/match/${profile.nextMatch.matchId}`}
          className="mt-2 flex items-center justify-between rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span className="text-zinc-500 dark:text-zinc-400">
            {profile.nextMatch.state === "in" ? "Live now" : "Next"} · vs{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {profile.nextMatch.opponent}
            </span>
          </span>
          <span className="text-xs text-zinc-400">
            {profile.nextMatch.state === "in"
              ? profile.nextMatch.statusDetail || "Live"
              : matchDate(profile.nextMatch.date)}
          </span>
        </Link>
      )}
    </section>
  );
}

const POSITION_GROUPS: { abbr: string; label: string }[] = [
  { abbr: "G", label: "Goalkeepers" },
  { abbr: "D", label: "Defenders" },
  { abbr: "M", label: "Midfielders" },
  { abbr: "F", label: "Forwards" },
];

function PlayerLine({ p }: { p: SquadPlayer }) {
  return (
    <li className="flex items-center gap-3 py-1.5 text-sm">
      <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-400">
        {p.jersey}
      </span>
      <span className="flex-1 truncate text-zinc-800 dark:text-zinc-200">
        {p.name}
      </span>
      {p.age != null && (
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {p.age}y
        </span>
      )}
      {p.height && (
        <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
          {p.height}
        </span>
      )}
    </li>
  );
}

function Squad({ profile }: { profile: TeamProfile }) {
  if (profile.squad.length === 0) return null;
  const known = new Set(POSITION_GROUPS.map((g) => g.abbr));
  const groups = POSITION_GROUPS.map((g) => ({
    ...g,
    players: profile.squad.filter((p) => p.positionAbbr === g.abbr),
  }));
  const others = profile.squad.filter((p) => !known.has(p.positionAbbr));
  if (others.length > 0) {
    groups.push({ abbr: "?", label: "Other", players: others });
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Full Squad
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groups
          .filter((g) => g.players.length > 0)
          .map((g) => (
            <div
              key={g.abbr}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {g.label}
                <span className="ml-1 text-zinc-300 dark:text-zinc-600">
                  ({g.players.length})
                </span>
              </h3>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {g.players.map((p) => (
                  <PlayerLine key={p.id || p.jersey + p.name} p={p} />
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}

export function TeamProfileView({
  profile,
  history,
  ranking,
}: {
  profile: TeamProfile;
  history: TeamHistory | null;
  ranking: FifaRanking | null;
}) {
  const standing =
    profile.groupName && profile.rank
      ? `${profile.groupName} · ${ordinal(profile.rank)}`
      : profile.groupName ?? null;
  const record =
    profile.wins + profile.draws + profile.losses > 0
      ? `${profile.wins}W · ${profile.draws}D · ${profile.losses}L`
      : null;

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← All teams
        </Link>

        <header className="mt-6 flex items-center gap-4">
          {profile.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo}
              alt=""
              className="h-16 w-16 shrink-0 object-contain"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {profile.name}
              </h1>
              <FavoriteButton teamId={profile.id} className="shrink-0" />
            </div>
            {profile.color && (
              <div
                className="mt-1.5 h-1 w-16 rounded-full"
                style={{ backgroundColor: `#${profile.color}` }}
              />
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              {standing && <span>{standing}</span>}
              {record && <span>{record}</span>}
              {ranking && <span>FIFA #{ranking.rank}</span>}
            </div>
          </div>
        </header>

        <History history={history} ranking={ranking} />
        <AgeProfileSection profile={profile} />
        <FormSection profile={profile} />
        <Squad profile={profile} />
      </main>
    </div>
  );
}
