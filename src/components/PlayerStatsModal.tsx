"use client";

import { useEffect } from "react";
import type { LineupPlayer, PlayerStatLine } from "@/lib/espn";

// Preferred display order; anything else falls to the end. `appearances` and
// `subIns` are noise here, so they're dropped.
const ORDER = [
  "totalGoals",
  "goalAssists",
  "totalShots",
  "shotsOnTarget",
  "saves",
  "goalsConceded",
  "shotsFaced",
  "foulsCommitted",
  "foulsSuffered",
  "offsides",
  "yellowCards",
  "redCards",
  "ownGoals",
];
const HIDDEN = new Set(["appearances", "subIns"]);

// Per-stat accent + glyph, so the panel reads at a glance instead of being a
// uniform grid of numbers. Colour classes are spelled out in full so Tailwind
// keeps them.
type Accent = {
  dot: string; // small indicator for secondary chips
  bg: string; // featured-card tint
  ring: string; // featured-card border
  text: string; // featured-card accent text
};
const ACCENTS: Record<string, Accent> = {
  emerald: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  sky: {
    dot: "bg-sky-400",
    bg: "bg-sky-500/10",
    ring: "border-sky-500/30",
    text: "text-sky-400",
  },
  amber: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    ring: "border-amber-500/30",
    text: "text-amber-400",
  },
  red: {
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    ring: "border-red-500/30",
    text: "text-red-400",
  },
  orange: {
    dot: "bg-orange-400",
    bg: "bg-orange-500/10",
    ring: "border-orange-500/30",
    text: "text-orange-400",
  },
  zinc: {
    dot: "bg-zinc-400",
    bg: "bg-zinc-500/10",
    ring: "border-zinc-500/30",
    text: "text-zinc-300",
  },
};
const STAT_ACCENT: Record<string, keyof typeof ACCENTS> = {
  totalGoals: "emerald",
  goalAssists: "sky",
  totalShots: "zinc",
  shotsOnTarget: "zinc",
  saves: "emerald",
  goalsConceded: "orange",
  shotsFaced: "zinc",
  foulsCommitted: "orange",
  foulsSuffered: "zinc",
  offsides: "zinc",
  yellowCards: "amber",
  redCards: "red",
  ownGoals: "red",
};
const accentOf = (name: string): Accent => ACCENTS[STAT_ACCENT[name] ?? "zinc"];

// A tiny glyph for a stat, matching the toast/timeline language where one exists.
function Glyph({ name }: { name: string }) {
  if (name === "totalGoals" || name === "ownGoals")
    return <span aria-hidden>⚽</span>;
  if (name === "yellowCards")
    return <span aria-hidden className="inline-block h-3.5 w-2.5 rounded-[2px] bg-amber-400" />;
  if (name === "redCards")
    return <span aria-hidden className="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-600" />;
  return null;
}

export function PlayerStatsModal({
  player,
  teamName,
  onClose,
}: {
  player: LineupPlayer | null;
  teamName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [player, onClose]);

  if (!player) return null;

  const rank = (n: string) => {
    const i = ORDER.indexOf(n);
    return i === -1 ? 99 : i;
  };
  const stats = player.stats
    .filter((s) => !HIDDEN.has(s.name) && s.label)
    .sort((a, b) => rank(a.name) - rank(b.name));

  // Goalkeepers lead with saves; everyone else with attacking output. Detect
  // the keeper by position only — outfield players can carry a saves/shotsFaced
  // stat of 0, which must not promote them to the keeper layout. Goals conceded
  // is a team outcome, not an individual highlight, so it stays in the chips.
  const isKeeper = (player.position ?? "").toUpperCase().startsWith("G");
  const featuredNames = isKeeper ? ["saves"] : ["totalGoals", "goalAssists"];

  const byName = new Map(stats.map((s) => [s.name, s]));
  const featured = featuredNames
    .map((n) => byName.get(n))
    .filter((s): s is PlayerStatLine => Boolean(s));
  const featuredSet = new Set(featured.map((s) => s.name));
  const rest = stats.filter((s) => !featuredSet.has(s.name));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-toast-in relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-base font-extrabold tabular-nums text-white ring-2 ring-amber-400/70 dark:bg-zinc-800">
            {player.jersey || "–"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {player.name}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {player.position || "—"} · {teamName}
            </div>
            {(player.subbedIn || player.subbedOut) && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {player.subbedIn && (
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    ▲ Subbed on
                  </span>
                )}
                {player.subbedOut && (
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                    ▼ Subbed off
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-zinc-400 transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {stats.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No match stats available for this player yet.
            </p>
          ) : (
            <>
              {featured.length > 0 && (
                <div
                  className={`grid gap-3 ${featured.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {featured.map((s) => {
                    const a = accentOf(s.name);
                    return (
                      <div
                        key={s.name}
                        className={`rounded-xl border p-4 text-center ${a.bg} ${a.ring}`}
                      >
                        <div
                          className={`flex items-center justify-center gap-1.5 text-3xl font-extrabold tabular-nums ${a.text}`}
                        >
                          <Glyph name={s.name} />
                          {s.value}
                        </div>
                        <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {rest.length > 0 && (
                <div
                  className={`grid grid-cols-2 gap-2 ${featured.length > 0 ? "mt-3" : ""}`}
                >
                  {rest.map((s) => {
                    const a = accentOf(s.name);
                    return (
                      <div
                        key={s.name}
                        className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
                          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {s.label}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                          {s.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
