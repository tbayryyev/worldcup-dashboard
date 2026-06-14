"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "wc26:favTeams";

// Favorite team ids live in localStorage and are shared across every component
// via useSyncExternalStore — the idiomatic, SSR/hydration-safe way to read an
// external store. `cache` holds a stable snapshot reference (required so React
// doesn't loop), only replaced when the set actually changes.
const listeners = new Set<() => void>();
let cache: string[] = [];
let loaded = false;
const SERVER_SNAPSHOT: string[] = [];

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): string[] {
  if (!loaded) {
    cache = load();
    loaded = true;
  }
  return cache;
}

function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

function persist(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore (private mode / quota) */
  }
  listeners.forEach((l) => l());
}

export function useFavorites() {
  const favs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    const cur = getSnapshot();
    persist(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);

  const isFav = useCallback((id: string) => favs.includes(id), [favs]);

  // `ready` kept for callers; the store is already hydration-safe.
  return { favs, ready: true, toggle, isFav };
}
