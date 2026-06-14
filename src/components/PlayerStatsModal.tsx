"use client";

import { useEffect } from "react";
import type { LineupPlayer } from "@/lib/espn";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="animate-toast-in relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {player.name}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              #{player.jersey} · {player.position || "—"} · {teamName}
              {player.subbedOut && " · subbed off"}
              {player.subbedIn && " · subbed on"}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-zinc-400 transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        {stats.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No match stats available for this player yet.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
