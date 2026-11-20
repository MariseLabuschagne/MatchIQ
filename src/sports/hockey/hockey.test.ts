import { describe, expect, it } from "vitest";
import { appendEvents, removeLastGroup, type NewEvent } from "../../core/events";
import { newClock } from "../../core/clock";
import type { Match } from "../../core/types";
import * as A from "./actions";
import type { HockeySetup } from "./model";
import { deriveLive } from "./reducer";
import { computeStats, effectiveness } from "./stats";
import { hockeyInsights } from "./insights";
import { convertLegacyHockey, legacyScore, type LegacyMatch } from "./legacy";

const setup: HockeySetup = { competition: "", ourTeam: "Us", opponent: "Them", venue: "", format: "4", periodMinutes: 15 };

function newMatch(): Match<HockeySetup> {
  const now = new Date().toISOString();
  return { id: "m1", sport: "hockey", schemaVersion: 1, createdAt: now, updatedAt: now, completedAt: null, status: "active", setup, events: [], clock: newClock(15) };
}

/** Plays taps through the real capture flow. */
function play(taps: ((live: ReturnType<typeof deriveLive>, m: Match<HockeySetup>) => NewEvent[])[]) {
  let m = newMatch() as Match;
  for (const tap of taps) {
    const live = deriveLive(setup, m.events);
    m = appendEvents(m, tap(live, m as Match<HockeySetup>));
  }
  return m as Match<HockeySetup>;
}

const hadOn = (m: Match<HockeySetup>, pos: number) => m.events.some((e) => e.type === "shot" && e.data.pos === pos && e.data.result === "on");

describe("hockey capture flow", () => {
  it("links an attack journey: entry, shot, corner, PC goal", () => {
    const m = play([
      (l) => A.startEntry(l, "for", "right"),
      (l) => A.shot(l, "blocked"),
      (l) => A.penaltyCorner(l),
      (l) => A.pcResult(l, "goal")
    ]);
    const live = deriveLive(setup, m.events);
    expect(live.score).toEqual({ for: 1, against: 0 });
    expect(live.open).toBeNull();
    const s = computeStats(setup, m.events).total;
    expect(s.entries.for.right).toBe(1);
    expect(s.goals.for.pc).toBe(1);
    expect(s.possWithShot.for).toBe(1);
    expect(s.possWithGoal.for).toBe(1);
  });

  it("adds a shot on target to a field goal when none was captured", () => {
    const m = play([(l) => A.startEntry(l, "for", "left"), (l, mm) => A.fieldGoal(l, hadOn(mm, l.open!.pos))]);
    const s = computeStats(setup, m.events).total;
    expect(s.shots.for.on).toBe(1);
    expect(s.goals.for.field).toBe(1);
  });

  it("does not double-count the shot when one was already on target", () => {
    const m = play([(l) => A.startEntry(l, "for", "left"), (l) => A.shot(l, "on"), (l, mm) => A.fieldGoal(l, hadOn(mm, l.open!.pos))]);
    expect(computeStats(setup, m.events).total.shots.for.on).toBe(1);
  });

  it("closes an open attack when another button is tapped (no stale attack ids)", () => {
    const m = play([(l) => A.startEntry(l, "for", "topD"), (l) => A.generalTurnover(l, true, "mid"), (l) => A.shot(l, "on")]);
    const live = deriveLive(setup, m.events);
    expect(live.open).toBeNull();
    // The shot after the turnover was ignored because no attack was open.
    expect(computeStats(setup, m.events).total.shots.for.total).toBe(0);
  });

  it("keeps the attack open for a card", () => {
    const m = play([(l) => A.startEntry(l, "for", "topD"), (l) => A.card(l, "green")]);
    expect(deriveLive(setup, m.events).open).not.toBeNull();
  });

  it("defence: entry against, GK save, PC against defended", () => {
    const m = play([
      (l) => A.startEntry(l, "against", "left"),
      (l) => A.gkSave(l),
      (l) => A.penaltyCorner(l),
      (l) => A.pcResult(l, "secondWave")
    ]);
    const s = computeStats(setup, m.events).total;
    expect(s.entries.against.left).toBe(1);
    expect(s.gkSaves).toBe(1);
    expect(s.shots.against.on).toBe(1);
    expect(s.pcAgainst.secondWave).toBe(1);
    expect(deriveLive(setup, m.events).open).toBeNull();
  });

  it("penalty stroke scored counts as a goal", () => {
    const m = play([(l) => A.startEntry(l, "for", "right"), (l) => A.penaltyStroke(l), (l) => A.strokeResult(l, true)]);
    expect(deriveLive(setup, m.events).score.for).toBe(1);
  });

  it("undo removes the whole tap", () => {
    const m = play([(l) => A.startEntry(l, "for", "left"), (l, mm) => A.fieldGoal(l, hadOn(mm, l.open!.pos))]);
    const { match } = removeLastGroup(m);
    const live = deriveLive(setup, match.events);
    expect(live.score.for).toBe(0);
    expect(live.open?.pos).toBe(1);
  });

  it("credits stats to the right period", () => {
    const m = play([(l) => A.startEntry(l, "for", "left"), (l) => A.nextPeriod(l, "Q2"), (l) => A.startEntry(l, "for", "right"), (l) => A.startEntry(l, "for", "right")]);
    const st = computeStats(setup, m.events);
    expect(st.byPeriod.Q1.entries.for.total).toBe(1);
    expect(st.byPeriod.Q2.entries.for.total).toBe(2);
    expect(st.total.entries.for.total).toBe(3);
  });

  it("effectiveness percentages", () => {
    const m = play([
      (l) => A.startEntry(l, "for", "left"), (l) => A.shot(l, "on"),
      (l) => A.startEntry(l, "for", "left"), (l) => A.shot(l, "off"),
      (l) => A.startEntry(l, "for", "left"), (l) => A.turnoverInCircle(l),
      (l) => A.startEntry(l, "for", "left"), (l, mm) => A.fieldGoal(l, hadOn(mm, l.open!.pos))
    ]);
    const e = effectiveness(computeStats(setup, m.events).total);
    expect(e.entryToShot).toBe(75);
    expect(e.entryToGoal).toBe(25);
    expect(e.shotAccuracy).toBe(67);
    expect(e.fieldGoalConversion).toBe(50);
  });
});

describe("hockey insights", () => {
  it("flags entries without shots and a left-side bias", () => {
    const taps: Parameters<typeof play>[0] = [];
    for (let i = 0; i < 8; i++) {
      taps.push((l) => A.startEntry(l, "for", i < 6 ? "left" : "right"));
      if (i === 0) taps.push((l) => A.shot(l, "on"));
    }
    const ins = hockeyInsights(computeStats(setup, play(taps).events));
    expect(ins.workons.map((w) => w.title)).toContain("Entries without a shot");
    expect(ins.plan.map((p) => p.title)).toContain("Attack leans left");
  });
});

describe("legacy conversion", () => {
  const legacy: LegacyMatch = {
    id: "old1", createdAt: "2026-05-01T10:00:00Z", completedAt: "2026-05-01T11:10:00Z",
    ourTeam: "Us", opponent: "Them", format: "4", periodLength: "15", sport: "hockey",
    events: [
      { eventType: "attackStart", period: "Q1", attackId: 1 },
      { eventType: "entryRight", period: "Q1", attackId: 1 },
      { eventType: "shotOnTarget", period: "Q1", attackId: 1 },
      { eventType: "goalScored", period: "Q1", attackId: 1 },
      { eventType: "defenceEntryLeft", period: "Q1", attackId: 1 },
      { eventType: "pcConceded", period: "Q1", attackId: 1 },
      { eventType: "pcGoalConceded", period: "Q1", attackId: 1 },
      { eventType: "turnoverMidfield", period: "Q2", attackId: 1 },
      { eventType: "attackStart", period: "Q2", attackId: 2 },
      { eventType: "entryLeft", period: "Q2", attackId: 2 },
      { eventType: "entryPenaltyCorner", period: "Q2", attackId: 2 },
      { eventType: "pcGoal", period: "Q2", attackId: 2 },
      { eventType: "yellowCard", period: "Q3", attackId: 2 }
    ]
  };

  it("keeps the score and the main counts", () => {
    const m = convertLegacyHockey(legacy)!;
    expect(deriveLive(m.setup, m.events).score).toEqual(legacyScore(legacy));
    const st = computeStats(m.setup, m.events);
    expect(st.total.entries.for.total).toBe(2);
    expect(st.total.entries.against.total).toBe(1);
    expect(st.total.pcs.against).toBe(1);
    expect(st.total.goals.against.pc).toBe(1);
    expect(st.byPeriod.Q2.turnoversWon.mid).toBe(1);
    expect(st.byPeriod.Q3.cards.yellow).toBe(1);
    expect(m.importedFrom).toBe("v2");
  });

  it("skips softball matches", () => {
    expect(convertLegacyHockey({ sport: "softball", events: [] })).toBeNull();
  });
});
