import type { MatchEvent } from "../../core/types";

export type P = "p" | "o";
export type Level = "quick" | "standard" | "detailed";
export type FormatKey = "bo3" | "bo3mtb" | "pro8" | "short4" | "bo5g" | "bo7g" | "bo9g" | "bo11g";
export type Ending = "ace" | "doubleFault" | "winner" | "forcedError" | "unforcedError" | "error" | "unknown";
export type ShotKey = "forehand" | "backhand" | "volley" | "overhead" | "return" | "droplob";

export interface TennisSetup {
  player: string;
  opponent: string;
  competition: string;
  format: FormatKey;
  noAd: boolean;
  firstServer: P;
  level: Level;
  endReason: string | null;
}

export interface Format {
  label: string;
  setsToWin: number;
  games: number;
  tbAt: number;
  finalMtb: boolean;
  /** Games formats: one set of exactly this many games, all played (e.g. 5 → 3–2, 4–1 or 5–0). No tiebreak. */
  totalGames?: number;
}

export const FORMATS: Record<FormatKey, Format> = {
  bo3: { label: "Best of 3 sets", setsToWin: 2, games: 6, tbAt: 6, finalMtb: false },
  bo3mtb: { label: "2 sets + match tiebreak to 10", setsToWin: 2, games: 6, tbAt: 6, finalMtb: true },
  pro8: { label: "One pro set to 8", setsToWin: 1, games: 8, tbAt: 8, finalMtb: false },
  short4: { label: "Short sets to 4, best of 3", setsToWin: 2, games: 4, tbAt: 4, finalMtb: false },
  bo5g: { label: "Best of 5 games (all 5 played)", setsToWin: 1, games: 5, tbAt: 99, finalMtb: false, totalGames: 5 },
  bo7g: { label: "Best of 7 games (all 7 played)", setsToWin: 1, games: 7, tbAt: 99, finalMtb: false, totalGames: 7 },
  bo9g: { label: "Best of 9 games (all 9 played)", setsToWin: 1, games: 9, tbAt: 99, finalMtb: false, totalGames: 9 },
  bo11g: { label: "Best of 11 games (all 11 played)", setsToWin: 1, games: 11, tbAt: 99, finalMtb: false, totalGames: 11 }
};

export const LEVELS: Record<Level, { label: string; hint: string }> = {
  quick: { label: "Quick", hint: "Who won and how · 1–2 taps" },
  standard: { label: "Standard", hint: "Adds 1st/2nd serve and final shot · 2–4 taps" },
  detailed: { label: "Detailed", hint: "Adds serve direction, rally length, position · 3–6 taps" }
};

export const SHOTS: [ShotKey, string][] = [
  ["forehand", "Forehand"], ["backhand", "Backhand"], ["volley", "Volley"],
  ["overhead", "Overhead"], ["return", "Return"], ["droplob", "Drop / lob"]
];
export const SHOT_LABEL = Object.fromEntries(SHOTS) as Record<ShotKey, string>;
export const RALLY: [string, string][] = [["1-3", "1–3"], ["4-6", "4–6"], ["7-9", "7–9"], ["10+", "10+"]];
export const DIRS: [string, string][] = [["wide", "Wide"], ["body", "Body"], ["t", "T"]];
export const POSITIONS: [string, string][] = [["baseline", "Baseline"], ["approach", "Approaching"], ["net", "At net"]];

export const other = (s: P): P => (s === "p" ? "o" : "p");

/** One point, merged from its "point" event and any later "detail" events. */
export interface TennisPoint {
  id: string;
  winner: P;
  serve: "first" | "second" | null;
  ending: Ending | null;
  finalShotBy: P | null;
  shot?: ShotKey | null;
  serveDir?: string | null;
  rally?: string | null;
  position?: string | null;
  missed?: boolean;
  level?: Level;
  taps?: number;
  ms?: number;
}

/**
 * Events: "point" is recorded the moment "who won" is tapped (so the score moves at once);
 * each optional detail tap afterwards is its own "detail" event pointing at that point,
 * so undo removes one tap at a time.
 */
export function mergePoints(events: MatchEvent[]): TennisPoint[] {
  const points: TennisPoint[] = [];
  const byId = new Map<string, TennisPoint>();
  for (const e of events) {
    if (e.type === "point") {
      const pt = { id: e.id, ...(e.data as Omit<TennisPoint, "id">) };
      points.push(pt);
      byId.set(e.id, pt);
    } else if (e.type === "detail") {
      const d = e.data as { point: string } & Partial<TennisPoint>;
      const pt = byId.get(d.point);
      if (pt) {
        const { point: _ignored, ...rest } = d;
        void _ignored;
        Object.assign(pt, rest);
      }
    }
  }
  return points;
}
