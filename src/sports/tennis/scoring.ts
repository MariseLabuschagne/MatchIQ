import { FORMATS, other, type P, type TennisPoint, type TennisSetup } from "./model";

export interface SetScore {
  p: number;
  o: number;
  tb: { p: number; o: number } | null;
  mtb?: boolean;
  w: P;
}

export interface PointContext {
  i: number;
  set: number;
  server: P;
  tb: boolean;
  games: string;
  pts: string;
  /** Who would win the game (on the other player's serve) if they won this point. */
  bpFor: P | null;
  /** 30–30 or later, break points and late tiebreak points. */
  pressure: boolean;
}

export interface GameRecord {
  server: P;
  winner: P;
  tb: boolean;
  set: number;
}

export interface TennisState {
  sets: SetScore[];
  setsWon: Record<P, number>;
  games: Record<P, number>;
  pts: Record<P, number>;
  tb: boolean;
  mtb: boolean;
  tbTarget: number;
  tbFirst: P | null;
  tbCount: number;
  server: P;
  done: boolean;
  winner: P | null;
  gameLog: GameRecord[];
  ctx: (PointContext | null)[];
}

export function ptLabels(s: Pick<TennisState, "tb" | "mtb" | "pts">, noAd: boolean): { p: string; o: string; note: string } {
  if (s.tb) return { p: String(s.pts.p), o: String(s.pts.o), note: s.mtb ? "Match tiebreak" : "Tiebreak" };
  const a = s.pts.p, b = s.pts.o, m = ["0", "15", "30", "40"];
  if (a >= 3 && b >= 3) {
    if (a === b) return { p: "40", o: "40", note: noAd ? "Deciding point" : "Deuce" };
    return a > b ? { p: "Ad", o: "40", note: "Advantage" } : { p: "40", o: "Ad", note: "Advantage" };
  }
  return { p: m[a], o: m[b], note: "" };
}

export function bpFor(s: Pick<TennisState, "tb" | "done" | "server" | "pts">, noAd: boolean): P | null {
  if (s.tb || s.done) return null;
  const srv = s.server, r = other(srv);
  if (s.pts[r] >= 3 && (s.pts[r] > s.pts[srv] || (noAd && s.pts[r] === 3 && s.pts[srv] === 3))) return r;
  return null;
}

/** In a tiebreak the first point is served by one player, then two each. */
export function tbServer(first: P, count: number): P {
  if (count === 0) return first;
  return Math.floor((count - 1) / 2) % 2 === 0 ? other(first) : first;
}

/** Pure: replay all points into the full score, server and per-point context. */
export function replay(setup: Pick<TennisSetup, "format" | "noAd" | "firstServer">, points: Pick<TennisPoint, "winner">[]): TennisState {
  const f = FORMATS[setup.format], noAd = setup.noAd;
  const s: TennisState = {
    sets: [], setsWon: { p: 0, o: 0 }, games: { p: 0, o: 0 }, pts: { p: 0, o: 0 }, tb: false, mtb: false, tbTarget: 7, tbFirst: null, tbCount: 0,
    server: setup.firstServer, done: false, winner: null, gameLog: [], ctx: []
  };
  const maybeMtb = () => {
    if (f.finalMtb && s.setsWon.p === f.setsToWin - 1 && s.setsWon.o === f.setsToWin - 1) {
      s.tb = true; s.mtb = true; s.tbTarget = 10; s.tbFirst = s.server; s.tbCount = 0;
    }
  };
  const endSet = (w: P) => {
    s.setsWon[w]++; s.games = { p: 0, o: 0 }; s.pts = { p: 0, o: 0 }; s.tb = false; s.mtb = false;
    if (s.setsWon[w] === f.setsToWin) { s.done = true; s.winner = w; } else maybeMtb();
  };

  points.forEach((pt, i) => {
    if (s.done) { s.ctx.push(null); return; }
    const srv = s.server, lab = ptLabels(s, noAd);
    const c: PointContext = {
      i, set: s.sets.length + 1, server: srv, tb: s.tb, games: `${s.games.p}–${s.games.o}`, pts: `${lab.p}–${lab.o}`,
      bpFor: bpFor(s, noAd), pressure: false
    };
    c.pressure = s.tb ? Math.max(s.pts.p, s.pts.o) >= s.tbTarget - 1 : (s.pts.p >= 2 && s.pts.o >= 2) || c.bpFor !== null;
    s.ctx.push(c);
    const w = pt.winner, l = other(w);
    s.pts[w]++;
    if (s.tb) {
      s.tbCount++;
      if (s.pts[w] >= s.tbTarget && s.pts[w] - s.pts[l] >= 2) {
        const tbs = { p: s.pts.p, o: s.pts.o };
        s.gameLog.push({ server: srv, winner: w, tb: true, set: c.set });
        if (s.mtb) s.sets.push({ p: w === "p" ? 1 : 0, o: w === "o" ? 1 : 0, tb: tbs, mtb: true, w });
        else { s.games[w]++; s.sets.push({ p: s.games.p, o: s.games.o, tb: tbs, w }); }
        s.server = other(s.tbFirst!);
        endSet(w);
      } else s.server = tbServer(s.tbFirst!, s.tbCount);
    } else if (s.pts[w] >= 4 && (noAd || s.pts[w] - s.pts[l] >= 2)) {
      s.gameLog.push({ server: srv, winner: w, tb: false, set: c.set });
      s.games[w]++; s.pts = { p: 0, o: 0 }; s.server = other(srv);
      const setWon = f.firstTo ? s.games[w] >= f.firstTo : s.games[w] >= f.games && s.games[w] - s.games[l] >= 2;
      if (setWon) { s.sets.push({ p: s.games.p, o: s.games.o, tb: null, w }); endSet(w); }
      else if (s.games.p === f.tbAt && s.games.o === f.tbAt) { s.tb = true; s.tbTarget = 7; s.tbFirst = s.server; s.tbCount = 0; }
    }
  });
  return s;
}

export function resultString(r: Pick<TennisState, "sets">): string {
  return r.sets
    .map((x) => (x.mtb && x.tb ? `[${x.tb.p}–${x.tb.o}]` : `${x.p}–${x.o}${x.tb ? `(${Math.min(x.tb.p, x.tb.o)})` : ""}`))
    .join("  ");
}
