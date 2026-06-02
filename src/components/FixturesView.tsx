"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/lib/espn";
import { MatchCard } from "@/components/MatchCard";

function dateHeader(iso: string): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dayKey(iso: string): string {
  // YYYY-MM-DD bucket in the viewer's local time so matches near midnight UTC
  // group with the correct calendar day for the user.
  if (!iso) return "tbd";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function matchesQuery(match: Match, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    match.home.name.toLowerCase().includes(needle) ||
    match.away.name.toLowerCase().includes(needle) ||
    match.home.abbreviation.toLowerCase().includes(needle) ||
    match.away.abbreviation.toLowerCase().includes(needle)
  );
}

export function FixturesView({ matches }: { matches: Match[] }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = matches.filter((m) => matchesQuery(m, query));
    const buckets = new Map<string, { label: string; matches: Match[] }>();
    for (const m of filtered) {
      const key = dayKey(m.date);
      if (!buckets.has(key)) {
        buckets.set(key, { label: dateHeader(m.date), matches: [] });
      }
      buckets.get(key)!.matches.push(m);
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [matches, query]);

  const totalShown = grouped.reduce((n, g) => n + g.matches.length, 0);

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="team-filter" className="sr-only">
          Filter by team
        </label>
        <input
          id="team-filter"
          type="search"
          placeholder="Filter by team (e.g. Mexico, BRA)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="mt-2 text-xs text-zinc-400">
          Showing {totalShown} of {matches.length} matches
        </div>
      </div>

      {totalShown === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No matches match &ldquo;{query}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.label}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {g.label}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
