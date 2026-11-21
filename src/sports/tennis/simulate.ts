import { other, type TennisPoint, type TennisSetup } from "./model";
import { replay } from "./scoring";

/** Seeded random numbers, so the sample match is the same every time. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, list: [T, number][]): T {
  const tot = list.reduce((s, x) => s + x[1], 0);
  let x = r() * tot;
  for (const [v, w] of list) {
    x -= w;
    if (x <= 0) return v;
  }
  return list[list.length - 1][0];
}

/** A generated Detailed-level match, used for the "See a sample report" button and in tests. */
export function simulateMatch(setup: TennisSetup, seed = 20261120): TennisPoint[] {
  const r = rng(seed);
  const pts: TennisPoint[] = [];
  for (let n = 0; n < 260; n++) {
    const st = replay(setup, pts);
    if (st.done) break;
    const srv = st.server;
    const id = `s${n}`;
    if (r() < 0.015) {
      pts.push({ id, winner: r() < 0.5 ? "p" : "o", serve: null, ending: "unknown", finalShotBy: null, missed: true, taps: 2, ms: 4000 });
      continue;
    }
    const firstIn = r() < (srv === "p" ? 0.56 : 0.62);
    const serve = firstIn ? "first" : "second";
    if (!firstIn && r() < (srv === "p" ? 0.17 : 0.09)) {
      pts.push({ id, winner: other(srv), serve, ending: "doubleFault", finalShotBy: srv, taps: 2, ms: 2600 + r() * 1500 });
      continue;
    }
    if (firstIn && r() < 0.07) {
      pts.push({ id, winner: srv, serve, ending: "ace", finalShotBy: srv, serveDir: pick(r, [["t", 3], ["wide", 2], ["body", 1]]), taps: 4, ms: 3400 + r() * 2000 });
      continue;
    }
    let pWin = srv === "p" ? (firstIn ? 0.68 : 0.4) : firstIn ? 0.37 : 0.56;
    const position = pick(r, [["baseline", 7], ["approach", 2], ["net", 1.4]]);
    if (position === "net") pWin += 0.16;
    const rally = pick(r, [["short", 4], ["10+", 1]]);
    if (rally === "10+") pWin -= 0.12;
    const serveDir = srv === "p" ? pick(r, [["t", 2], ["wide", 2], ["body", 1]]) : null;
    if (serveDir === "t") pWin += 0.06;
    const winner = r() < pWin ? "p" : "o";
    const isWinner = r() < (winner === "p" ? 0.3 : 0.27);
    const finalShotBy = isWinner ? winner : other(winner);
    const ending = isWinner ? "winner" : finalShotBy === "o" ? "error" : r() < 0.55 ? "unforcedError" : "forcedError";
    const shot = isWinner
      ? pick(r, finalShotBy === "p" ? [["forehand", 6], ["backhand", 1.5], ["volley", 2], ["overhead", 1]] : [["forehand", 4], ["backhand", 3], ["volley", 1]])
      : pick(r, finalShotBy === "p" ? [["forehand", 3], ["backhand", 5], ["return", 2], ["volley", 0.6], ["droplob", 0.4]] : [["forehand", 2], ["backhand", 4.5], ["return", 1.5], ["volley", 0.5]]);
    pts.push({ id, winner, serve, ending, finalShotBy, shot: shot as TennisPoint["shot"], serveDir, rally, position, taps: 6, ms: 5200 + r() * 5200 });
  }
  return pts;
}
