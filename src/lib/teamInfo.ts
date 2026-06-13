// Curated historical reference data, keyed by ESPN team id.
//
// ESPN's API exposes no World Cup titles, appearance counts, or FIFA rankings
// (verified — none of these fields exist anywhere in the soccer API), yet they
// are exactly the context a newcomer wants. So this is a hand-maintained table.
//
// - `titles`       — World Cups won (only 8 nations ever have).
// - `appearances`  — World Cup tournaments contested, INCLUDING 2026.
// - `bestFinish`   — best-ever result, for quick context.
//
// FIFA ranking lives separately in `data/fifa-rankings.json` (see
// `lib/fifaRanking.ts`) so it can be refreshed independently of this history.
//
// Teams not in this table fall back to "—" in the UI, so a missing/abandoned
// entry degrades gracefully rather than breaking the page.

export interface TeamHistory {
  titles: number;
  appearances: number;
  bestFinish: string;
}

export const TEAM_HISTORY: Record<string, TeamHistory> = {
  "624": { titles: 0, appearances: 5, bestFinish: "Round of 16 (2014)" }, // Algeria
  "202": { titles: 3, appearances: 19, bestFinish: "Champions (1978, 1986, 2022)" }, // Argentina
  "628": { titles: 0, appearances: 7, bestFinish: "Round of 16 (2006, 2022)" }, // Australia
  "474": { titles: 0, appearances: 8, bestFinish: "3rd place (1954)" }, // Austria
  "459": { titles: 0, appearances: 15, bestFinish: "3rd place (2018)" }, // Belgium
  "452": { titles: 0, appearances: 2, bestFinish: "Group stage (2014)" }, // Bosnia-Herzegovina
  "205": { titles: 5, appearances: 23, bestFinish: "Champions (1958, 1962, 1970, 1994, 2002)" }, // Brazil
  "206": { titles: 0, appearances: 3, bestFinish: "Group stage" }, // Canada
  "2597": { titles: 0, appearances: 1, bestFinish: "Debut (2026)" }, // Cape Verde
  "208": { titles: 0, appearances: 7, bestFinish: "Quarterfinals (2014)" }, // Colombia
  "2850": { titles: 0, appearances: 2, bestFinish: "Group stage (1974, as Zaire)" }, // Congo DR
  "477": { titles: 0, appearances: 7, bestFinish: "Runners-up (2018)" }, // Croatia
  "11678": { titles: 0, appearances: 1, bestFinish: "Debut (2026)" }, // Curaçao
  "450": { titles: 0, appearances: 2, bestFinish: "Group stage (2006); runners-up as Czechoslovakia" }, // Czechia
  "209": { titles: 0, appearances: 5, bestFinish: "Round of 16 (2006)" }, // Ecuador
  "2620": { titles: 0, appearances: 4, bestFinish: "Group stage" }, // Egypt
  "448": { titles: 1, appearances: 17, bestFinish: "Champions (1966)" }, // England
  "478": { titles: 2, appearances: 17, bestFinish: "Champions (1998, 2018)" }, // France
  "481": { titles: 4, appearances: 21, bestFinish: "Champions (1954, 1974, 1990, 2014)" }, // Germany
  "4469": { titles: 0, appearances: 5, bestFinish: "Quarterfinals (2010)" }, // Ghana
  "2654": { titles: 0, appearances: 2, bestFinish: "Group stage (1974)" }, // Haiti
  "469": { titles: 0, appearances: 7, bestFinish: "Group stage" }, // Iran
  "4375": { titles: 0, appearances: 2, bestFinish: "Group stage (1986)" }, // Iraq
  "4789": { titles: 0, appearances: 4, bestFinish: "Group stage" }, // Ivory Coast
  "627": { titles: 0, appearances: 8, bestFinish: "Round of 16 (2002, 2010, 2018, 2022)" }, // Japan
  "2917": { titles: 0, appearances: 1, bestFinish: "Debut (2026)" }, // Jordan
  "203": { titles: 0, appearances: 18, bestFinish: "Quarterfinals (1970, 1986)" }, // Mexico
  "2869": { titles: 0, appearances: 7, bestFinish: "4th place (2022)" }, // Morocco
  "449": { titles: 0, appearances: 12, bestFinish: "Runners-up (1974, 1978, 2010)" }, // Netherlands
  "2666": { titles: 0, appearances: 3, bestFinish: "Group stage (unbeaten in 2010)" }, // New Zealand
  "464": { titles: 0, appearances: 4, bestFinish: "Round of 16 (1998)" }, // Norway
  "2659": { titles: 0, appearances: 2, bestFinish: "Group stage (2018)" }, // Panama
  "210": { titles: 0, appearances: 9, bestFinish: "Quarterfinals (2010)" }, // Paraguay
  "482": { titles: 0, appearances: 9, bestFinish: "3rd place (1966)" }, // Portugal
  "4398": { titles: 0, appearances: 2, bestFinish: "Group stage (2022)" }, // Qatar
  "655": { titles: 0, appearances: 7, bestFinish: "Round of 16 (1994)" }, // Saudi Arabia
  "580": { titles: 0, appearances: 9, bestFinish: "Group stage" }, // Scotland
  "654": { titles: 0, appearances: 4, bestFinish: "Quarterfinals (2002)" }, // Senegal
  "467": { titles: 0, appearances: 4, bestFinish: "Group stage" }, // South Africa
  "451": { titles: 0, appearances: 12, bestFinish: "4th place (2002)" }, // South Korea
  "164": { titles: 1, appearances: 17, bestFinish: "Champions (2010)" }, // Spain
  "466": { titles: 0, appearances: 13, bestFinish: "Runners-up (1958)" }, // Sweden
  "475": { titles: 0, appearances: 13, bestFinish: "Quarterfinals (1934, 1938, 1954)" }, // Switzerland
  "659": { titles: 0, appearances: 7, bestFinish: "Group stage" }, // Tunisia
  "465": { titles: 0, appearances: 3, bestFinish: "3rd place (2002)" }, // Türkiye
  "660": { titles: 0, appearances: 12, bestFinish: "3rd place (1930)" }, // United States
  "212": { titles: 2, appearances: 15, bestFinish: "Champions (1930, 1950)" }, // Uruguay
  "2570": { titles: 0, appearances: 1, bestFinish: "Debut (2026)" }, // Uzbekistan
};

export function teamHistory(id: string): TeamHistory | null {
  return TEAM_HISTORY[id] ?? null;
}
