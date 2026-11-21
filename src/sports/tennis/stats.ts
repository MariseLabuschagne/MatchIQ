import { frac, InsightCollector, plural } from "../../core/insights";
import type { Insight } from "../../core/types";
import { isLongRally, SHOT_LABEL, type ShotKey, type TennisPoint } from "./model";
import type { TennisState } from "./scoring";

interface Bucket { n: number; won: number; w: number; e: number; ue: number }
const bucket = (o: Record<string, Bucket>, k: string): Bucket => (o[k] ??= { n: 0, won: 0, w: 0, e: 0, ue: 0 });

export interface TennisStats {
  n: number; won: number; missed: number;
  srv: { n: number; won: number }; ret: { n: number; won: number }; ret2: { n: number; won: number };
  first: { n: number; inn: number; won: number }; second: { n: number; won: number };
  aces: number; dfs: number; dfsPressure: number; oAces: number; oDfs: number;
  winners: number; fe: number; ue: number; err: number; oErr: number; oWinners: number; errorsAll: number;
  bpFaced: number; bpSaved: number; bpChances: number; bpWon: number;
  pressure: { n: number; won: number };
  shots: Record<string, Bucket>; oShots: Record<string, Bucket>;
  sets: { n: number; won: number; winners: number; errors: number; ue: number }[];
  net: { n: number; won: number }; rally: Record<string, Bucket>; dir: Record<string, Bucket>;
  holds: { n: number; won: number }; breaks: { n: number; won: number };
  taps: number[]; ms: number[]; run: { len: number; set: number }; detailCount: number;
}

export function computeTennisStats(points: TennisPoint[], r: TennisState): TennisStats {
  const st: TennisStats = {
    n: 0, won: 0, missed: 0, srv: { n: 0, won: 0 }, ret: { n: 0, won: 0 }, ret2: { n: 0, won: 0 }, first: { n: 0, inn: 0, won: 0 }, second: { n: 0, won: 0 },
    aces: 0, dfs: 0, dfsPressure: 0, oAces: 0, oDfs: 0, winners: 0, fe: 0, ue: 0, err: 0, oErr: 0, oWinners: 0, errorsAll: 0,
    bpFaced: 0, bpSaved: 0, bpChances: 0, bpWon: 0, pressure: { n: 0, won: 0 }, shots: {}, oShots: {}, sets: [], net: { n: 0, won: 0 },
    rally: {}, dir: {}, holds: { n: 0, won: 0 }, breaks: { n: 0, won: 0 }, taps: [], ms: [], run: { len: 0, set: 0 }, detailCount: 0
  };
  points.forEach((pt, i) => {
    const c = r.ctx[i];
    if (!c) return;
    const won = pt.winner === "p" ? 1 : 0, by = pt.finalShotBy, e = pt.ending;
    st.n++; st.won += won;
    if (pt.missed) st.missed++;
    const sb = (st.sets[c.set - 1] ??= { n: 0, won: 0, winners: 0, errors: 0, ue: 0 });
    sb.n++; sb.won += won;
    if (c.server === "p") {
      st.srv.n++; st.srv.won += won;
      if (pt.serve) {
        st.first.n++;
        if (pt.serve === "first") { st.first.inn++; st.first.won += won; } else { st.second.n++; st.second.won += won; }
      }
    } else {
      st.ret.n++; st.ret.won += won;
      if (pt.serve === "second") { st.ret2.n++; st.ret2.won += won; }
    }
    if (e === "ace") { if (by === "p") st.aces++; else st.oAces++; }
    if (e === "doubleFault") { if (by === "p") { st.dfs++; if (c.pressure) st.dfsPressure++; } else st.oDfs++; }
    if (e === "winner") { if (by === "p") { st.winners++; sb.winners++; } else st.oWinners++; }
    const isErr = e === "forcedError" || e === "unforcedError" || e === "error";
    if (isErr) {
      if (by === "p") {
        sb.errors++;
        if (e === "forcedError") st.fe++; else if (e === "unforcedError") { st.ue++; sb.ue++; } else st.err++;
      } else st.oErr++;
    }
    if (c.bpFor === "o") { st.bpFaced++; st.bpSaved += won; }
    if (c.bpFor === "p") { st.bpChances++; st.bpWon += won; }
    if (c.pressure) { st.pressure.n++; st.pressure.won += won; }
    if (pt.shot && by) {
      const b = bucket(by === "p" ? st.shots : st.oShots, pt.shot);
      if (e === "winner") b.w++;
      if (isErr) { b.e++; if (e === "unforcedError") b.ue++; }
    }
    if (pt.position === "net") { st.net.n++; st.net.won += won; }
    if (pt.rally) { const rb = bucket(st.rally, isLongRally(pt.rally) ? "10+" : "short"); rb.n++; rb.won += won; }
    if (pt.serveDir && c.server === "p") { const db = bucket(st.dir, pt.serveDir); db.n++; db.won += won; }
    if (pt.shot || pt.serve) st.detailCount++;
    if (pt.taps) { st.taps.push(pt.taps); st.ms.push(pt.ms ?? 0); }
  });
  let run = 0, runSet = 0;
  for (const g of r.gameLog) {
    if (!g.tb) {
      if (g.server === "p") { st.holds.n++; if (g.winner === "p") st.holds.won++; }
      else { st.breaks.n++; if (g.winner === "p") st.breaks.won++; }
    }
    if (g.winner === "o") { run++; if (run === 1) runSet = g.set; if (run > st.run.len) st.run = { len: run, set: runSet }; } else run = 0;
  }
  st.errorsAll = st.fe + st.ue + st.err;
  return st;
}

export interface TennisInsights { strengths: Insight[]; workons: Insight[]; plan: Insight[] }

export function tennisInsights(st: TennisStats, playerName: string, opponentName: string): TennisInsights {
  const ins = new InsightCollector();
  const r1 = st.first.inn ? st.first.won / st.first.inn : 0;
  if (st.first.inn >= 6 && r1 >= 0.65) ins.add("strength", r1 * st.first.inn, "Strong first serve", `Won ${frac(st.first.won, st.first.inn)} points when the first serve went in.`);
  if (st.holds.n >= 3 && st.holds.won / st.holds.n >= 0.7) ins.add("strength", st.holds.won, "Holding serve", `Held ${frac(st.holds.won, st.holds.n)} service games.`);
  if (st.bpFaced >= 3 && st.bpSaved / st.bpFaced >= 0.6) ins.add("strength", st.bpSaved * 1.5, "Calm on break points", `Saved ${frac(st.bpSaved, st.bpFaced)} break points.`);
  if (st.bpChances >= 3 && st.bpWon / st.bpChances >= 0.5) ins.add("strength", st.bpWon * 1.5, "Taking break chances", `Converted ${frac(st.bpWon, st.bpChances)} break points.`);
  if (st.ret.n >= 12 && st.ret.won / st.ret.n >= 0.45) ins.add("strength", st.ret.won / 2, "Returning well", `Won ${frac(st.ret.won, st.ret.n)} points on the opponent's serve.`);
  if (st.net.n >= 4 && st.net.won / st.net.n >= 0.65) ins.add("strength", st.net.won, "Effective at the net", `Won ${frac(st.net.won, st.net.n)} points at the net. Come forward more often.`);
  if (st.pressure.n >= 8 && st.pressure.won / st.pressure.n >= 0.55) ins.add("strength", st.pressure.won, "Wins the big points", `Won ${frac(st.pressure.won, st.pressure.n)} points at 30–30 or later and on break points.`);
  if (st.winners >= 5 && st.winners >= st.errorsAll) ins.add("strength", st.winners, "More winners than errors", `${plural(st.winners, "winner")} and ${plural(st.errorsAll, "error")}.`);
  for (const k of Object.keys(st.shots) as ShotKey[]) {
    const b = st.shots[k], label = SHOT_LABEL[k];
    if (b.w >= 4 && b.w >= b.e) ins.add("strength", b.w, `${label} is working`, `${label}: ${plural(b.w, "winner")}, ${plural(b.e, "error")}.`);
    if (b.e >= 5 && b.e >= 2 * Math.max(b.w, 1)) {
      if (k === "return") ins.add("workon", b.e, "Return errors", `Missed ${plural(b.e, "return")}${b.ue ? ` (${b.ue} unforced)` : ""}. Aim for depth through the middle.`);
      else ins.add("workon", b.e - b.w, `${label} breaking down`, `${label}: ${plural(b.w, "winner")}, ${plural(b.e, "error")}${b.ue ? ` (${b.ue} unforced)` : ""}.`);
    }
  }
  const short = st.rally["short"], long = st.rally["10+"];
  if (short && short.n >= 8 && short.won / short.n >= 0.6) ins.add("strength", short.won / 2, "Wins the shorter points", `Won ${frac(short.won, short.n)} points under 10 shots.`);
  if (long && long.n >= 6 && long.won / long.n >= 0.6) ins.add("strength", long.won / 2, "Strong in long rallies", `Won ${frac(long.won, long.n)} points that went 10 or more shots.`);
  if (long && long.n >= 6 && long.won / long.n < 0.4) ins.add("workon", long.n - long.won, "Long rallies", `Won only ${frac(long.won, long.n)} points that went 10 or more shots. Build fitness and patience.`);
  const r2 = st.second.n ? st.second.won / st.second.n : 1;
  if (st.second.n >= 6 && r2 < 0.45) ins.add("workon", (0.5 - r2) * st.second.n * 3, "Second serve under attack", `Won only ${frac(st.second.won, st.second.n)} points on the second serve.`);
  if (st.first.n >= 10 && st.first.inn / st.first.n < 0.55) ins.add("workon", (0.6 - st.first.inn / st.first.n) * st.first.n, "More first serves in", `${frac(st.first.inn, st.first.n)} first serves went in.`);
  if (st.dfs >= 3) ins.add("workon", st.dfs * 1.2, "Double faults", `${plural(st.dfs, "double fault")}${st.dfsPressure ? `, ${st.dfsPressure} of them on big points` : ""}.`);
  if (st.errorsAll >= 8 && st.errorsAll > st.winners * 1.5) ins.add("workon", (st.errorsAll - st.winners) / 2, "Points decided by own errors", `${plural(st.errorsAll, "error")}${st.ue ? ` (${st.ue} unforced)` : ""} against ${plural(st.winners, "winner")}.`);
  if (st.bpFaced >= 3 && st.bpSaved / st.bpFaced < 0.4) ins.add("workon", st.bpFaced - st.bpSaved, "Break points on serve", `Saved only ${frac(st.bpSaved, st.bpFaced)} break points.`);
  if (st.bpChances >= 3 && st.bpWon / st.bpChances < 0.3) ins.add("workon", st.bpChances - st.bpWon, "Missed break chances", `Converted ${frac(st.bpWon, st.bpChances)} break points.`);
  if (st.sets.length >= 2) {
    const a = st.sets[0].errors, z = st.sets[st.sets.length - 1].errors;
    if (z >= a * 1.5 && z - a >= 4) ins.add("workon", z - a, "Errors rose as the match went on", `${a} errors in set 1, ${z} in set ${st.sets.length}. Check fitness and focus.`);
  }
  if (st.run.len >= 4) ins.add("workon", st.run.len, "Losing streak", `Lost ${st.run.len} games in a row${st.sets.length > 1 ? ` in set ${st.run.set}` : ""}. Practise a reset routine between points.`);
  if (st.pressure.n >= 8 && st.pressure.won / st.pressure.n < 0.4) ins.add("workon", st.pressure.n - st.pressure.won, "Big points", `Won ${frac(st.pressure.won, st.pressure.n)} points at 30–30 or later and on break points.`);

  let worst: ShotKey | null = null;
  for (const k of Object.keys(st.oShots) as ShotKey[]) {
    const b = st.oShots[k];
    if (k !== "return" && b.e >= 4 && (!worst || b.e > st.oShots[worst].e)) worst = k;
  }
  if (worst) {
    const s = SHOT_LABEL[worst].toLowerCase(), b = st.oShots[worst];
    ins.add("plan", b.e, "Scouting", `${opponentName} made ${plural(b.e, "error")} on the ${s} and hit ${plural(b.w, "winner")} with it. Aim more balls to the ${s} on big points.`);
  } else if (st.ret2.n >= 5 && st.ret2.won / st.ret2.n >= 0.55) {
    ins.add("plan", st.ret2.won, "Scouting", `Attack the opponent's second serve: ${playerName} won ${frac(st.ret2.won, st.ret2.n)} of those points.`);
  }
  return { strengths: ins.top("strength"), workons: ins.top("workon"), plan: ins.top("plan", 1) };
}
