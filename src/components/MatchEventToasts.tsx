"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchDetail, MatchEvent } from "@/lib/espn";

interface Toast {
  id: number;
  ev: MatchEvent;
  abbr: string;
}

// Base minute of a clock, ignoring stoppage time: "45'+2'" -> "45", "23'" -> "23".
// ESPN refines the clock of an in-progress event across polls (adding stoppage
// time) — normalizing it keeps the same goal from looking "new" a second time.
function baseMinute(clock: string | undefined): string {
  const m = clock?.match(/\d+/);
  return m ? m[0] : "";
}

// Stable signature for an event so we can tell which ones are genuinely new
// between polls (MatchEvent has no id of its own). Deliberately excludes the
// volatile `text` (commentary wording gets rewritten) and uses only the base
// minute — ESPN re-emits the same goal with a refined clock/text once the
// scoreline catches up, and we must NOT treat that as a new event.
function sig(e: MatchEvent): string {
  const who = e.scorer ?? e.player ?? e.playerIn ?? "";
  return [e.type, e.teamId, who, baseMinute(e.clock)].join("|");
}

function toastStyle(type: MatchEvent["type"]): { ring: string; label: string } {
  switch (type) {
    case "goal":
      return { ring: "border-emerald-500/60 bg-emerald-950/80", label: "GOAL!" };
    case "yellow":
      return { ring: "border-yellow-400/60 bg-yellow-950/70", label: "Yellow Card" };
    case "red":
      return { ring: "border-red-500/60 bg-red-950/80", label: "Red Card" };
    case "sub":
      return { ring: "border-zinc-600 bg-zinc-900/90", label: "Substitution" };
    default:
      return { ring: "border-zinc-600 bg-zinc-900/90", label: "" };
  }
}

function Mark({ type }: { type: MatchEvent["type"] }) {
  if (type === "goal") return <span aria-hidden>⚽</span>;
  if (type === "yellow")
    return <span aria-hidden className="inline-block h-4 w-3 rounded-[2px] bg-yellow-400" />;
  if (type === "red")
    return <span aria-hidden className="inline-block h-4 w-3 rounded-[2px] bg-red-600" />;
  if (type === "sub")
    return <span aria-hidden className="text-emerald-400">⇄</span>;
  return null;
}

function detail(ev: MatchEvent): string {
  if (ev.type === "goal") {
    const tags = [ev.penalty ? "pen" : "", ev.ownGoal ? "OG" : ""]
      .filter(Boolean)
      .join(", ");
    const assist = ev.assist ? ` · assist ${ev.assist}` : "";
    return `${ev.scorer ?? "Goal"}${tags ? ` (${tags})` : ""}${assist}`;
  }
  if (ev.type === "sub") {
    return `▲ ${ev.playerIn ?? "—"}   ▼ ${ev.playerOut ?? "—"}`;
  }
  return ev.player ?? ev.text;
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone(toast.id), 15000);
    return () => clearTimeout(t);
  }, [toast.id, onDone]);

  const { ring, label } = toastStyle(toast.ev.type);
  return (
    <button
      onClick={() => onDone(toast.id)}
      className={`animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-lg backdrop-blur ${ring}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-lg">
        <Mark type={toast.ev.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-white">
            {label}
          </span>
          {toast.ev.clock && (
            <span className="font-mono text-xs text-zinc-400">{toast.ev.clock}</span>
          )}
          {toast.abbr && (
            <span className="ml-auto text-xs font-semibold text-zinc-300">
              {toast.abbr}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm text-zinc-100">
          {detail(toast.ev)}
        </span>
      </span>
    </button>
  );
}

export function MatchEventToasts({ match }: { match: MatchDetail }) {
  const seen = useRef<Set<string>>(new Set());
  const seeded = useRef(false);
  const nextId = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const abbrFor = useCallback(
    (teamId: string) =>
      teamId === match.home.id
        ? match.home.abbreviation
        : teamId === match.away.id
          ? match.away.abbreviation
          : "",
    [match.home.id, match.home.abbreviation, match.away.id, match.away.abbreviation],
  );

  useEffect(() => {
    const fresh: MatchEvent[] = [];
    for (const e of match.events) {
      const s = sig(e);
      if (!seen.current.has(s)) {
        seen.current.add(s);
        // Don't toast everything that already happened on first load.
        if (seeded.current) fresh.push(e);
      }
    }
    seeded.current = true;
    if (fresh.length === 0) return;
    setToasts((prev) =>
      [
        ...prev,
        ...fresh.map((ev) => ({
          id: ++nextId.current,
          ev,
          abbr: abbrFor(ev.teamId),
        })),
      ].slice(-3),
    );
  }, [match.events, abbrFor]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDone={remove} />
      ))}
    </div>
  );
}
