import type { MatchEvent } from "../../core/types";
import type { HockeyEventMap, HockeySetup, Side } from "./model";
import { periodsFor } from "./model";

export type HEvent = MatchEvent & { type: keyof HockeyEventMap };

export function data<K extends keyof HockeyEventMap>(e: MatchEvent, _type: K): HockeyEventMap[K] {
  return e.data as unknown as HockeyEventMap[K];
}

export interface OpenPossession {
  pos: number;
  side: Side;
  loc: string;
  shots: number;
  pcs: number;
  /** True while a penalty corner is waiting for its outcome. */
  pcPending: boolean;
  /** True while a penalty stroke is waiting for its outcome. */
  strokePending: boolean;
}

export interface HockeyLive {
  score: { for: number; against: number };
  period: string;
  periodIndex: number;
  isLastPeriod: boolean;
  open: OpenPossession | null;
  nextPos: number;
}

/** Pure: derive the live state from the event list. */
export function deriveLive(setup: HockeySetup, events: MatchEvent[]): HockeyLive {
  const periods = periodsFor(setup.format);
  let period = periods[0];
  const score = { for: 0, against: 0 };
  let open: OpenPossession | null = null;
  let maxPos = 0;

  for (const e of events) {
    switch (e.type) {
      case "period":
        period = data(e, "period").to;
        open = null;
        break;
      case "entry": {
        const d = data(e, "entry");
        maxPos = Math.max(maxPos, d.pos);
        open = { pos: d.pos, side: d.side, loc: d.loc, shots: 0, pcs: 0, pcPending: false, strokePending: false };
        break;
      }
      case "shot":
        if (open && data(e, "shot").pos === open.pos) open.shots++;
        break;
      case "pc":
        if (open && data(e, "pc").pos === open.pos) {
          open.pcs++;
          open.pcPending = true;
        }
        break;
      case "pcResult":
        if (open && data(e, "pcResult").pos === open.pos) open.pcPending = false;
        break;
      case "stroke":
        if (open && data(e, "stroke").pos === open.pos) open.strokePending = true;
        break;
      case "strokeResult":
        if (open && data(e, "strokeResult").pos === open.pos) open.strokePending = false;
        break;
      case "goal":
        score[data(e, "goal").side]++;
        break;
      case "possessionEnd":
        if (open && data(e, "possessionEnd").pos === open.pos) open = null;
        break;
    }
  }
  const periodIndex = Math.max(0, periods.indexOf(period));
  return { score, period, periodIndex, isLastPeriod: periodIndex === periods.length - 1, open, nextPos: maxPos + 1 };
}
