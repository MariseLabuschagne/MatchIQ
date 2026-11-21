import type { NewEvent } from "../../core/events";
import type { CardColour, EntryLocation, PcResultAgainst, PcResultFor, ShotResult, Side, Zone } from "./model";
import type { HockeyLive } from "./reducer";

/**
 * The capture flow: each function turns one tap into the events to record.
 * They are pure, so the whole flow is unit-tested without a screen.
 *
 * Rule that fixes the v2 "stale attack" bug: any tap outside the open possession
 * first closes it, so later events can never be attached to an old attack.
 */

const ev = (type: string, data: Record<string, unknown>): NewEvent => ({ type, data });

function closeOpen(live: HockeyLive): NewEvent[] {
  return live.open ? [ev("possessionEnd", { side: live.open.side, pos: live.open.pos, reason: "done" })] : [];
}

export function startEntry(live: HockeyLive, side: Side, loc: EntryLocation): NewEvent[] {
  return [...closeOpen(live), ev("entry", { side, loc, pos: live.nextPos })];
}

export function endPossession(live: HockeyLive): NewEvent[] {
  return closeOpen(live);
}

export function shot(live: HockeyLive, result: ShotResult): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  return [ev("shot", { side: o.side, result, pos: o.pos, fromPc: o.pcPending || undefined })];
}

/** Opposition shot saved by our goalkeeper (counts as a shot on target against). */
export function gkSave(live: HockeyLive): NewEvent[] {
  const o = live.open;
  if (!o || o.side !== "against") return [];
  return [ev("shot", { side: "against", result: "on", pos: o.pos }), ev("gkSave", { pos: o.pos })];
}

/** Field goal from open play inside the possession. Adds the shot on target if none was captured. */
export function fieldGoal(live: HockeyLive, hadShotOnTarget: boolean): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  const out: NewEvent[] = [];
  if (!hadShotOnTarget) out.push(ev("shot", { side: o.side, result: "on", pos: o.pos }));
  out.push(ev("goal", { side: o.side, kind: "field", pos: o.pos }));
  out.push(ev("possessionEnd", { side: o.side, pos: o.pos, reason: "goal" }));
  return out;
}

export function penaltyCorner(live: HockeyLive): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  return [ev("pc", { side: o.side, pos: o.pos })];
}

export function pcResult(live: HockeyLive, result: PcResultFor | PcResultAgainst): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  const out = [ev("pcResult", { side: o.side, result, pos: o.pos })];
  if (result === "goal") {
    out.push(ev("goal", { side: o.side, kind: "pc", pos: o.pos }));
    out.push(ev("possessionEnd", { side: o.side, pos: o.pos, reason: "goal" }));
  } else if (o.side === "against" && (result === "secondWave" || result === "turnoverWon")) {
    out.push(ev("possessionEnd", { side: o.side, pos: o.pos, reason: "defended" }));
  }
  return out;
}

export function penaltyStroke(live: HockeyLive): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  return [ev("stroke", { side: o.side, pos: o.pos })];
}

export function strokeResult(live: HockeyLive, scored: boolean): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  const out = [ev("strokeResult", { side: o.side, scored, pos: o.pos })];
  if (scored) {
    out.push(ev("goal", { side: o.side, kind: "stroke", pos: o.pos }));
    out.push(ev("possessionEnd", { side: o.side, pos: o.pos, reason: "goal" }));
  }
  return out;
}

export function longCornerInPossession(live: HockeyLive): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  return [ev("longCorner", { side: o.side, pos: o.pos }), ev("possessionEnd", { side: o.side, pos: o.pos, reason: "longCorner" })];
}

/** Attack: we lost the ball in the circle. Defence: we won it back. Either way the possession ends. */
export function turnoverInCircle(live: HockeyLive): NewEvent[] {
  const o = live.open;
  if (!o) return [];
  return [
    ev("turnoverInCircle", { side: o.side, pos: o.pos }),
    ev("possessionEnd", { side: o.side, pos: o.pos, reason: o.side === "for" ? "turnover" : "defended" })
  ];
}

/** Opposition scored from open play. */
export function goalAgainst(live: HockeyLive): NewEvent[] {
  const o = live.open;
  if (!o || o.side !== "against") return [];
  return [ev("goal", { side: "against", kind: "field", pos: o.pos }), ev("possessionEnd", { side: "against", pos: o.pos, reason: "goal" })];
}

export function generalTurnover(live: HockeyLive, won: boolean, zone: Zone): NewEvent[] {
  return [...closeOpen(live), ev("turnover", { won, zone })];
}

export function restart16(live: HockeyLive, side: Side): NewEvent[] {
  return [...closeOpen(live), ev("restart16", { side })];
}

export function longCorner(live: HockeyLive, side: Side): NewEvent[] {
  return [...closeOpen(live), ev("longCorner", { side, pos: null })];
}

/** Cards do not end an open attack: play can continue after a card. */
export function card(_live: HockeyLive, colour: CardColour, side: Side = "for"): NewEvent[] {
  return [ev("card", { colour, side })];
}

export function nextPeriod(live: HockeyLive, to: string): NewEvent[] {
  return [...closeOpen(live), ev("period", { to })];
}
