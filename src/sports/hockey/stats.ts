import { pct } from "../../core/insights";
import type { MatchEvent } from "../../core/types";
import type { HockeySetup, Side } from "./model";
import { periodsFor } from "./model";
import { data } from "./reducer";

/** Counts for one period (or the whole match). Every number on the summary comes from here. */
export interface HockeyCounts {
  entries: Record<Side, { left: number; topD: number; right: number; total: number }>;
  shots: Record<Side, { on: number; off: number; blocked: number; total: number }>;
  goals: Record<Side, { field: number; pc: number; stroke: number; total: number }>;
  pcs: Record<Side, number>;
  pcFor: { goal: number; saved: number; missed: number; brokenDown: number };
  pcAgainst: { goal: number; firstWave: number; gkSave: number; secondWave: number; turnoverWon: number };
  strokes: Record<Side, number>;
  longCorners: Record<Side, number>;
  /** Attack: possessions lost in the circle. Defence: possessions won back in our circle. */
  circleTurnovers: Record<Side, number>;
  turnoversWon: { att25: number; mid: number; def25: number; total: number };
  turnoversLost: { att25: number; mid: number; def25: number; total: number };
  restart16: Record<Side, number>;
  gkSaves: number;
  cards: { green: number; yellow: number; red: number; total: number };
  /** Possessions (circle entries) that produced at least one shot / goal. */
  possWithShot: Record<Side, number>;
  possWithGoal: Record<Side, number>;
  events: number;
}

function emptyCounts(): HockeyCounts {
  const sides = <T,>(f: () => T): Record<Side, T> => ({ for: f(), against: f() });
  return {
    entries: sides(() => ({ left: 0, topD: 0, right: 0, total: 0 })),
    shots: sides(() => ({ on: 0, off: 0, blocked: 0, total: 0 })),
    goals: sides(() => ({ field: 0, pc: 0, stroke: 0, total: 0 })),
    pcs: sides(() => 0),
    pcFor: { goal: 0, saved: 0, missed: 0, brokenDown: 0 },
    pcAgainst: { goal: 0, firstWave: 0, gkSave: 0, secondWave: 0, turnoverWon: 0 },
    strokes: sides(() => 0),
    longCorners: sides(() => 0),
    circleTurnovers: sides(() => 0),
    turnoversWon: { att25: 0, mid: 0, def25: 0, total: 0 },
    turnoversLost: { att25: 0, mid: 0, def25: 0, total: 0 },
    restart16: sides(() => 0),
    gkSaves: 0,
    cards: { green: 0, yellow: 0, red: 0, total: 0 },
    possWithShot: sides(() => 0),
    possWithGoal: sides(() => 0),
    events: 0
  };
}

export interface HockeyStats {
  periods: string[];
  byPeriod: Record<string, HockeyCounts>;
  total: HockeyCounts;
  /** Goals per period, for momentum. */
  timeline: { period: string; for: number; against: number }[];
}

function addTo(c: HockeyCounts, e: MatchEvent, possPeriod: Map<number, HockeyCounts>, shotPoss: Set<string>, goalPoss: Set<string>): void {
  c.events++;
  switch (e.type) {
    case "entry": {
      const d = data(e, "entry");
      c.entries[d.side][d.loc]++;
      c.entries[d.side].total++;
      possPeriod.set(d.pos, c);
      break;
    }
    case "shot": {
      const d = data(e, "shot");
      c.shots[d.side][d.result]++;
      c.shots[d.side].total++;
      if (d.pos != null) shotPoss.add(`${d.side}:${d.pos}`);
      break;
    }
    case "goal": {
      const d = data(e, "goal");
      c.goals[d.side][d.kind]++;
      c.goals[d.side].total++;
      if (d.pos != null) goalPoss.add(`${d.side}:${d.pos}`);
      break;
    }
    case "pc":
      c.pcs[data(e, "pc").side]++;
      break;
    case "pcResult": {
      const d = data(e, "pcResult");
      if (d.side === "for") c.pcFor[d.result as keyof HockeyCounts["pcFor"]]++;
      else c.pcAgainst[d.result as keyof HockeyCounts["pcAgainst"]]++;
      break;
    }
    case "stroke":
      c.strokes[data(e, "stroke").side]++;
      break;
    case "longCorner":
      c.longCorners[data(e, "longCorner").side]++;
      break;
    case "turnoverInCircle":
      c.circleTurnovers[data(e, "turnoverInCircle").side]++;
      break;
    case "turnover": {
      const d = data(e, "turnover");
      const t = d.won ? c.turnoversWon : c.turnoversLost;
      t[d.zone]++;
      t.total++;
      break;
    }
    case "restart16":
      c.restart16[data(e, "restart16").side]++;
      break;
    case "gkSave":
      c.gkSaves++;
      break;
    case "card": {
      c.cards[data(e, "card").colour]++;
      c.cards.total++;
      break;
    }
  }
}

/** Pure: all summary numbers by period and in total. */
export function computeStats(setup: HockeySetup, events: MatchEvent[]): HockeyStats {
  const periods = periodsFor(setup.format);
  const byPeriod: Record<string, HockeyCounts> = {};
  periods.forEach((p) => (byPeriod[p] = emptyCounts()));
  const total = emptyCounts();
  let period = periods[0];
  const possPeriod = new Map<number, HockeyCounts>();
  const possTotal = new Map<number, HockeyCounts>();
  const shotPoss = new Set<string>();
  const goalPoss = new Set<string>();

  for (const e of events) {
    if (e.type === "period") {
      period = data(e, "period").to;
      if (!byPeriod[period]) byPeriod[period] = emptyCounts();
      continue;
    }
    addTo(byPeriod[period], e, possPeriod, new Set(), new Set());
    addTo(total, e, possTotal, shotPoss, goalPoss);
  }
  // Possessions with a shot / goal are credited to the period of the entry.
  for (const key of shotPoss) {
    const [side, pos] = key.split(":") as [Side, string];
    total.possWithShot[side]++;
    const pc = possPeriod.get(Number(pos));
    if (pc) pc.possWithShot[side]++;
  }
  for (const key of goalPoss) {
    const [side, pos] = key.split(":") as [Side, string];
    total.possWithGoal[side]++;
    const pc = possPeriod.get(Number(pos));
    if (pc) pc.possWithGoal[side]++;
  }
  const allPeriods = Object.keys(byPeriod);
  return {
    periods: allPeriods,
    byPeriod,
    total,
    timeline: allPeriods.map((p) => ({ period: p, for: byPeriod[p].goals.for.total, against: byPeriod[p].goals.against.total }))
  };
}

export interface Effectiveness {
  entryToShot: number;
  entryToGoal: number;
  shotAccuracy: number;
  fieldGoalConversion: number;
  pcConversion: number;
  /** Defence: share of opposition entries that ended without a shot. */
  entriesDefended: number;
}

export function effectiveness(c: HockeyCounts): Effectiveness {
  return {
    entryToShot: pct(c.possWithShot.for, c.entries.for.total),
    entryToGoal: pct(c.possWithGoal.for, c.entries.for.total),
    shotAccuracy: pct(c.shots.for.on, c.shots.for.total),
    fieldGoalConversion: pct(c.goals.for.field, c.shots.for.on),
    pcConversion: pct(c.goals.for.pc, c.pcs.for),
    entriesDefended: pct(c.entries.against.total - c.possWithShot.against, c.entries.against.total)
  };
}
