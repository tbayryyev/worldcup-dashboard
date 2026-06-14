"use client";

import { useFavorites } from "@/hooks/useFavorites";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17.3 6.16 20.5l1.12-6.53L2.5 9.27l6.56-.95L12 2.5l2.94 5.82 6.56.95-4.78 4.7 1.12 6.53z" />
    </svg>
  );
}

export function FavoriteButton({
  teamId,
  className = "",
}: {
  teamId: string;
  className?: string;
}) {
  const { isFav, toggle, ready } = useFavorites();
  const active = ready && isFav(teamId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(teamId);
      }}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className={`transition ${
        active
          ? "text-amber-400"
          : "text-zinc-400 hover:text-amber-400 dark:text-zinc-500"
      } ${className}`}
    >
      <Star filled={active} />
    </button>
  );
}
