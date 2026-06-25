import type { LineupPlayer, TeamLineup } from "@/lib/espn";

interface Placed {
  player: LineupPlayer;
  x: number; // 0–100 across the pitch width
  y: number; // 0–100 down the pitch (GK at bottom ~90, attack at top ~12)
}

// Parse an ESPN position abbreviation (e.g. "CD-L", "RB", "CM-R", "RF", "F")
// into the vertical line it belongs to — goalkeeper (0) to forward (6) — and a
// signed horizontal score (negative = left, positive = right). ESPN encodes the
// side either as a suffix ("-L"/"-R") or as a leading L/R on a wide role, so we
// read both; the score also factors in how wide the role sits (a full-back is
// nearer the touchline than a centre-back on the same line), which gives a
// fully-determined left-to-right order within each line.
function posInfo(posRaw: string): { line: number; x: number } {
  const up = (posRaw || "").toUpperCase().trim();
  const suf = up.match(/-([LR])$/);
  const core = suf ? up.replace(/-[LR]$/, "") : up;
  const base = core.replace(/[^A-Z]/g, "");

  let side = 0; // -1 left · 0 centre · +1 right
  if (suf) side = suf[1] === "L" ? -1 : 1;
  else if (/^(RB|LB|RM|LM|RW|LW|RF|LF|RWB|LWB|RCB|LCB|RCM|LCM)$/.test(base))
    side = base[0] === "L" ? -1 : 1;

  // Wide roles (full-/wing-backs, wingers, side mids) sit further out than
  // central roles, so they get a larger magnitude on the same line.
  const wide = /^(RB|LB|RWB|LWB|RW|LW|RM|LM|WB|W)$/.test(base) ? 2 : 1;

  let line: number;
  if (base === "G" || base === "GK") line = 0;
  else if (/^(CB|CD|SW|RB|LB|RWB|LWB|WB|RCB|LCB)$/.test(base)) line = 1;
  else if (/^(DM|CDM)$/.test(base)) line = 2;
  else if (/^(CAM|AM)$/.test(base)) line = 4;
  else if (/^(RW|LW|W)$/.test(base)) line = 5;
  else if (/^(CF|ST|F|RF|LF|SS)$/.test(base)) line = 6;
  else line = 3; // CM / RM / LM / M and anything unrecognised

  return { line, x: side * wide };
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

const PITCH_MIN = 12; // leftmost player centre (%)
const PITCH_MAX = 88; // rightmost player centre (%)

// Turn a row's horizontal role scores (−2 wide-left … 0 centre … +2 wide-right)
// into pitch percentages, so a central role (x≈0, e.g. a lone "F") sits in the
// middle and a full-back hugs the touchline — rather than just spreading the
// row out evenly. Any team-mates that would overlap are nudged apart, then the
// whole row is re-centred so it stays balanced. `xScores` arrives sorted
// ascending (the caller orders the row left-to-right first).
function horizontalSpots(xScores: number[]): number[] {
  const n = xScores.length;
  if (n === 1) return [50];
  const SCALE = 19; // one x-unit ≈ 19% of pitch width (so ±2 → the touchlines)
  const GAP = 18; // minimum spacing between adjacent team-mates
  const spots = xScores.map((x) => 50 + x * SCALE);
  for (let i = 1; i < n; i++) {
    if (spots[i] - spots[i - 1] < GAP) spots[i] = spots[i - 1] + GAP;
  }
  const shift = 50 - (spots[0] + spots[n - 1]) / 2;
  return spots.map((v) => Math.max(PITCH_MIN, Math.min(PITCH_MAX, v + shift)));
}

function placePlayers(lineup: TeamLineup): Placed[] {
  const starters = lineup.starters;
  if (starters.length === 0) return [];

  const lineOf = (p: LineupPlayer) => posInfo(p.position).line;
  const sorted = [...starters].sort((a, b) => lineOf(a) - lineOf(b));
  const keepers = sorted.filter((p) => lineOf(p) === 0);
  const outfield = sorted.filter((p) => lineOf(p) !== 0);

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
      const r = lineOf(p);
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
    const ordered = [...row].sort((a, b) => {
      const dx = posInfo(a.position).x - posInfo(b.position).x;
      return dx !== 0 ? dx : a.name.localeCompare(b.name);
    });
    const xs = horizontalSpots(ordered.map((p) => posInfo(p.position).x));
    ordered.forEach((player, i) => placed.push({ player, x: xs[i], y }));
  });
  return placed;
}

export function LineupPitch({
  lineup,
  showSubs,
  onSelect,
}: {
  lineup: TeamLineup;
  showSubs: boolean;
  onSelect?: (player: LineupPlayer) => void;
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
          <button
            type="button"
            onClick={() => onSelect?.(player)}
            key={`${player.jersey}-${player.name}-${i}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none transition hover:scale-110 focus-visible:scale-110"
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
          </button>
        );
      })}
    </div>
  );
}
