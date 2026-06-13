import { LiveScores } from "@/components/LiveScores";
import { HomeStats } from "@/components/HomeStats";

export default function Home() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            World Cup 2026
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Live scores, updated automatically.
          </p>
        </header>
        <LiveScores />
        <HomeStats />
      </main>
    </div>
  );
}
