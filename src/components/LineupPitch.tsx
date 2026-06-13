import type { LineupPlayer, TeamLineup } from "@/lib/espn";

interface Placed {
  player: LineupPlayer;
  x: number; // 0–100 across the pitch width
  y: number; // 0–100 down the pitch (GK at bottom ~90, attack at top ~12)
}

// Which horizontal band a position sits in, from goalkeeper (0) to forward (6).
// Drives back-to-front ordering so players fill the formation rows correctly.
function lineRank(posRaw: string): number {
  const p = posRaw.toUpperCase().replace(/[^A-Z]/g, "");
  if (p.startsWith("G")) return 0;
  if (p.startsWith("DM") || p.startsWith("CDM")) return 2;
  if (
    p.startsWith("CB") ||
    p.startsWith("CD") ||
    p.startsWith("SW") ||
    p.startsWith("LWB") ||
    p.startsWith("RWB") ||
    p.startsWith("WB") ||
    p.startsWith("LB") ||
    p.startsWith("RB")
  )
    return 1;
  if (p.startsWith("CAM") || p.startsWith("AM")) return 4;
  if (p.startsWith("LW") || p.startsWith("RW")) return 5;
  if (p.startsWith("CF") || p.startsWith("ST") || p.startsWith("F")) return 6;
  return 3; // CM / LM / RM / M
}

// Left (−1) / centre (0) / right (+1) hint, from the position's side marker.
function sideScore(posRaw: string): number {
  const p = posRaw.toUpperCase();
  if (p.endsWith("-L")) return -1;
  if (p.endsWith("-R")) return 1;
  const base = p.replace(/[^A-Z]/g, "");
  if (/^(LB|LM|LW|LWB)$/.test(base)) return -1;
  if (/^(RB|RM|RW|RWB)$/.test(base)) return 1;
  return 0;
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function placePlayers(lineup: TeamLineup): Placed[] {
  const starters = lineup.starters;
  if (starters.length === 0) return [];

  const sorted = [...starters].sort(
    (a, b) => lineRank(a.position) - lineRank(b.position),
  );
  const keepers = sorted.filter((p) => lineRank(p.position) === 0);
  const outfield = sorted.filter((p) => lineRank(p.position) !== 0);

  // Prefer the formation string (e.g. "4-1-4-1") to define the rows; fall back
  // to grouping by line when it's missing or doesn't match the XI.
  const bands = (lineup.formation ?? "")
    .split(/[-–]/)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
  const bandsValid =
    bands.length > 0 &&
    bands.reduce((s, n) => s + n, 0) === outfield.length &&
    keepers.length >= 1;

  const rows: LineupPlayer[][] = [keepers.length ? [keepers[0]] : []];
  if (bandsValid) {
    let i = 0;
    for (const n of bands) {
      rows.push(outfield.slice(i, i + n));
      i += n;
    }
  } else {
    const byRank = new Map<number, LineupPlayer[]>();
    for (const p of outfield) {
      const r = lineRank(p.position);
      (byRank.get(r) ?? byRank.set(r, []).get(r)!).push(p);
    }
    [...byRank.keys()]
      .sort((a, b) => a - b)
      .forEach((k) => rows.push(byRank.get(k)!));
  }

  const numRows = rows.length;
  const yBottom = 90;
  const yTop = 12;
  const placed: Placed[] = [];
  rows.forEach((row, r) => {
    if (row.length === 0) return;
    const y =
      numRows > 1
        ? yBottom - (r * (yBottom - yTop)) / (numRows - 1)
        : (yBottom + yTop) / 2;
    const ordered = [...row].sort(
      (a, b) => sideScore(a.position) - sideScore(b.position),
    );
    const n = ordered.length;
    ordered.forEach((player, i) => {
      const x = n === 1 ? 50 : 12 + (i * 76) / (n - 1);
      placed.push({ player, x, y });
    });
  });
  return placed;
}

export function LineupPitch({
  lineup,
  showSubs,
}: {
  lineup: TeamLineup;
  showSubs: boolean;
}) {
  const placed = placePlayers(lineup);
  if (placed.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl ring-1 ring-black/20"
      style={{
        aspectRatio: "68 / 100",
        background:
          "repeating-linear-gradient(0deg, #15803d 0 10%, #169a48 10% 20%)",
      }}
    >
      {/* Pitch markings */}
      <svg
        viewBox="0 0 68 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.5}
          strokeWidth={0.4}
        >
          <rect x="1" y="1" width="66" height="98" rx="0.5" />
          <line x1="1" y1="50" x2="67" y2="50" />
          <circle cx="34" cy="50" r="9" />
          {/* bottom box (this team's goal) */}
          <rect x="13.85" y="83.5" width="40.3" height="15.5" />
          <rect x="24.85" y="93.5" width="18.3" height="5.5" />
          {/* top box */}
          <rect x="13.85" y="1" width="40.3" height="15.5" />
          <rect x="24.85" y="1" width="18.3" height="5.5" />
        </g>
        <g fill="#ffffff" fillOpacity={0.6}>
          <circle cx="34" cy="50" r="0.7" />
          <circle cx="34" cy="89" r="0.7" />
          <circle cx="34" cy="11" r="0.7" />
        </g>
      </svg>

      {/* Players */}
      {placed.map(({ player, x, y }, i) => {
        const off = showSubs && player.subbedOut;
        return (
          <div
            key={`${player.jersey}-${player.name}-${i}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold shadow ring-1 ring-black/20 ${
                off ? "bg-white/60 text-zinc-500" : "bg-white text-zinc-900"
              }`}
            >
              {player.jersey}
            </span>
            <span className="mt-0.5 max-w-[72px] truncate text-[10px] font-medium leading-tight text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_80%)]">
              {shortName(player.name)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
