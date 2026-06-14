import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Guide to the World Cup",
  description:
    "New to the World Cup? A beginner's guide to the 2026 tournament — the new 48-team format, host stadiums, rules, qualified nations, past winners and key dates.",
};

const LOGO = (code: string) =>
  `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;

const KEY_FACTS = [
  { value: "48", label: "Teams" },
  { value: "104", label: "Matches" },
  { value: "16", label: "Host cities" },
  { value: "3", label: "Host nations" },
];

const HOSTS = [
  {
    code: "usa",
    name: "United States",
    venues: [
      ["Atlanta", "Mercedes-Benz Stadium"],
      ["Boston", "Gillette Stadium"],
      ["Dallas", "AT&T Stadium"],
      ["Houston", "NRG Stadium"],
      ["Kansas City", "Arrowhead Stadium"],
      ["Los Angeles", "SoFi Stadium"],
      ["Miami", "Hard Rock Stadium"],
      ["New York / New Jersey", "MetLife Stadium · Final"],
      ["Philadelphia", "Lincoln Financial Field"],
      ["San Francisco Bay Area", "Levi's Stadium"],
      ["Seattle", "Lumen Field"],
    ],
  },
  {
    code: "mex",
    name: "Mexico",
    venues: [
      ["Mexico City", "Estadio Azteca · Opening match"],
      ["Guadalajara", "Estadio Akron"],
      ["Monterrey", "Estadio BBVA"],
    ],
  },
  {
    code: "can",
    name: "Canada",
    venues: [
      ["Toronto", "BMO Field"],
      ["Vancouver", "BC Place"],
    ],
  },
];

const CONFEDERATIONS = [
  ["UEFA — Europe", 16],
  ["CAF — Africa", 9],
  ["AFC — Asia", 8],
  ["CONMEBOL — South America", 6],
  ["CONCACAF — N. & C. America", 6],
  ["OFC — Oceania", 1],
  ["Intercontinental play-off", 2],
] as const;

const RULES: { title: string; body: string }[] = [
  {
    title: "Match length",
    body: "Two 45-minute halves plus added stoppage time, with a 15-minute break at halftime (“HT”).",
  },
  {
    title: "Group points",
    body: "A win is 3 points, a draw 1, a loss 0. Ties are broken by goal difference, then goals scored, then head-to-head.",
  },
  {
    title: "Knockout rounds",
    body: "No draws allowed. Level after 90 minutes → 30 minutes of extra time → a penalty shootout if still tied.",
  },
  {
    title: "Cards",
    body: "A yellow card is a caution; two yellows or a straight red means the player is sent off and the team plays a man down.",
  },
  {
    title: "Substitutions",
    body: "Each team can make up to 5 substitutions from a bench of reserves; squads are up to 26 players.",
  },
  {
    title: "VAR",
    body: "Video Assistant Referee reviews goals, penalties, red cards and mistaken identity to help the on-field referee.",
  },
];

const WINNERS: { year: string; host: string; champ: string; note: string }[] = [
  { year: "2022", host: "Qatar", champ: "Argentina", note: "beat France on penalties (3–3)" },
  { year: "2018", host: "Russia", champ: "France", note: "beat Croatia 4–2" },
  { year: "2014", host: "Brazil", champ: "Germany", note: "beat Argentina 1–0" },
  { year: "2010", host: "South Africa", champ: "Spain", note: "beat Netherlands 1–0" },
  { year: "2006", host: "Germany", champ: "Italy", note: "beat France on penalties" },
  { year: "2002", host: "Korea/Japan", champ: "Brazil", note: "beat Germany 2–0" },
];

const TITLES: [string, number][] = [
  ["Brazil", 5],
  ["Germany", 4],
  ["Italy", 4],
  ["Argentina", 3],
  ["France", 2],
  ["Uruguay", 2],
  ["England", 1],
  ["Spain", 1],
];

const DATES: [string, string][] = [
  ["Jun 11, 2026", "Opening match — Mexico City"],
  ["Jun 11–27", "Group stage (12 groups of 4)"],
  ["Jun 28 – Jul 3", "Round of 32"],
  ["Jul 4–7", "Round of 16"],
  ["Jul 9–11", "Quarter-finals"],
  ["Jul 14–15", "Semi-finals"],
  ["Jul 18", "Third-place play-off"],
  ["Jul 19, 2026", "Final — New York / New Jersey"],
];

function Section({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        <span aria-hidden>{emoji}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-black">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <header className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-emerald-50 to-white p-6 dark:border-zinc-800 dark:from-emerald-950/30 dark:to-zinc-950 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
            New to the World Cup? Start here
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            A beginner&apos;s guide to World Cup 2026
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-base">
            The FIFA World Cup is football&apos;s biggest event, held every four
            years. The 2026 edition is the largest ever — the first hosted by
            three countries (the United States, Mexico and Canada) and the first
            with <strong>48 teams</strong>. It runs from June 11 to July 19, 2026.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KEY_FACTS.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {f.value}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* What's new */}
        <Section title="What's new in 2026" emoji="🆕">
          <Card>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              The tournament expanded from 32 to <strong>48 teams</strong>,
              growing from 64 to <strong>104 matches</strong>. Here&apos;s how a
              champion is crowned:
            </p>
            <ol className="mt-4 space-y-3">
              {[
                ["12 groups of 4", "All 48 teams are drawn into 12 groups and each plays the other three once."],
                ["32 advance", "The top 2 from every group, plus the 8 best third-placed teams, reach a new Round of 32."],
                ["Knockouts", "Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final. One loss and you're out."],
                ["The Final", "The last two standing meet on July 19, 2026 at MetLife Stadium, New York / New Jersey."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    <strong className="text-zinc-900 dark:text-zinc-100">{t}.</strong>{" "}
                    {b}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </Section>

        {/* Defending champion */}
        <Section title="Defending champion" emoji="🏆">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/20 sm:col-span-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO("arg")} alt="" className="h-12 w-12 object-contain" />
              <div>
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Argentina
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Winners 2022 · 3rd title
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Card>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  Argentina won the 2022 final in Qatar, beating France 4–2 on
                  penalties after a thrilling 3–3 draw — Lionel Messi&apos;s
                  crowning moment. They arrive in 2026 as the team to beat.
                </p>
              </Card>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Recent winners
              </h3>
              <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                {WINNERS.map((w) => (
                  <li key={w.year} className="flex items-baseline gap-2 py-1.5">
                    <span className="w-10 shrink-0 font-mono text-xs text-zinc-400">
                      {w.year}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {w.champ}
                    </span>
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {w.note}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Most titles
              </h3>
              <ul className="space-y-1.5 text-sm">
                {TITLES.map(([team, n]) => (
                  <li key={team} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-zinc-700 dark:text-zinc-300">
                      {team}
                    </span>
                    <span className="text-amber-500">{"★".repeat(n)}</span>
                    <span className="ml-auto text-xs text-zinc-400">{n}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        {/* Rules */}
        <Section title="The rules, in plain English" emoji="📋">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RULES.map((r) => (
              <Card key={r.title}>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {r.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {r.body}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Hosts & stadiums */}
        <Section title="Hosts & stadiums" emoji="🏟️">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            16 cities across three countries will host the 104 matches.
          </p>
          <div className="space-y-5">
            {HOSTS.map((h) => (
              <div key={h.code}>
                <div className="mb-2 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={LOGO(h.code)} alt="" className="h-6 w-6 object-contain" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {h.name}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {h.venues.length} {h.venues.length === 1 ? "city" : "cities"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {h.venues.map(([city, stadium]) => (
                    <div
                      key={city}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {city}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {stadium}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Who qualifies */}
        <Section title="Who's playing" emoji="🌍">
          <Card>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              The 48 places are shared across the six continental confederations,
              with the three host nations qualifying automatically:
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CONFEDERATIONS.map(([name, n]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="text-zinc-700 dark:text-zinc-300">{name}</span>
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {n}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/teams"
              className="mt-4 inline-block text-sm font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-500"
            >
              Browse all 48 teams →
            </Link>
          </Card>
        </Section>

        {/* Key dates */}
        <Section title="Key dates" emoji="📅">
          <Card>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {DATES.map(([date, label]) => (
                <li key={label} className="flex items-baseline gap-3 py-2 text-sm">
                  <span className="w-28 shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
                    {date}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        {/* CTA */}
        <Section title="Start exploring" emoji="⚽">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["/", "Live scores"],
              ["/standings", "Standings"],
              ["/bracket", "Bracket"],
              ["/stats", "Top scorers"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
              >
                {label}
              </Link>
            ))}
          </div>
        </Section>

        <p className="mt-10 text-center text-xs text-zinc-400">
          Tournament facts are reference information compiled for newcomers and
          may be refined as FIFA confirms final details.
        </p>
      </main>
    </div>
  );
}
