import type { Metadata } from "next";
import { fetchAllFixtures } from "@/lib/espn";
import { FixturesView } from "@/components/FixturesView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fixtures",
  description: "Every match of the FIFA World Cup 2026 in one schedule.",
};

export default async function FixturesPage() {
  const data = await fetchAllFixtures();

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Fixtures
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            All {data.matches.length} matches across the tournament.
          </p>
        </header>
        <FixturesView matches={data.matches} />
      </main>
    </div>
  );
}
