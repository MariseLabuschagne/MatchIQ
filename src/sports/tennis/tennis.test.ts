import { describe, expect, it } from "vitest";
import type { MatchEvent } from "../../core/types";
import { mergePoints, type TennisSetup } from "./model";
import { replay, resultString } from "./scoring";
import { simulateMatch } from "./simulate";
import { computeTennisStats, tennisInsights } from "./stats";

const base = { format: "bo3" as const, noAd: false, firstServer: "p" as const };
const P = (n: number) => Array.from({ length: n }, () => ({ winner: "p" as const }));
const O = (n: number) => Array.from({ length: n }, () => ({ winner: "o" as const }));

describe("tennis scoring", () => {
  it("best of 5 games ends at 3 games, with no tiebreak or 2-game margin", () => {
    const g = { ...base, format: "bo5g" as const };
    // p wins 2 games, o wins 2 games, then p wins the 5th: 3–2.
    const r = replay(g, [...P(4), ...O(4), ...P(4), ...O(4), ...P(4)]);
    expect(r.done).toBe(true);
    expect(r.winner).toBe("p");
    expect(resultString(r)).toBe("3–2");
  });

  it("best of 7, 9 and 11 games end at 4, 5 and 6", () => {
    for (const [format, n] of [["bo7g", 4], ["bo9g", 5], ["bo11g", 6]] as const) {
      const before = replay({ ...base, format }, O(4 * (n - 1)));
      expect(before.done).toBe(false);
      const r = replay({ ...base, format }, O(4 * n));
      expect(r.done).toBe(true);
      expect(resultString(r)).toBe(`0–${n}`);
    }
  });

  it("6–0 6–0 ends the match", () => {
    const r = replay(base, P(48));
    expect(r.done).toBe(true);
    expect(resultString(r)).toBe("6–0  6–0");
  });

  it("deuce needs two clear points", () => {
    const r = replay(base, [...P(3), ...O(3), ...P(1), ...O(1), ...P(2)]);
    expect(r.games).toEqual({ p: 1, o: 0 });
    expect(r.server).toBe("o");
  });

  it("no-ad: deciding point at 40–40", () => {
    expect(replay({ ...base, noAd: true }, [...P(3), ...O(3), ...P(1)]).games).toEqual({ p: 1, o: 0 });
  });

  const toSixAll = () => {
    const pts: { winner: "p" | "o" }[] = [];
    for (let g = 0; g < 12; g++) pts.push(...(g % 2 === 0 ? P(4) : O(4)));
    return pts;
  };

  it("tiebreak at 6–6 with correct serving order", () => {
    const pts = toSixAll();
    expect(replay({ ...base, noAd: true }, pts).tb).toBe(true);
    const order = [0, 1, 2, 3, 4].map((k) => replay({ ...base, noAd: true }, [...pts, ...P(k)]).server).join("");
    expect(order).toBe("poopp");
    const after = replay({ ...base, noAd: true }, [...pts, ...P(7)]);
    expect(resultString(after)).toBe("7–6(0)");
    expect(after.server).toBe("o");
  });

  it("match tiebreak to 10 replaces the third set", () => {
    const s = { format: "bo3mtb" as const, noAd: true, firstServer: "p" as const };
    expect(replay(s, [...P(24), ...O(24)]).mtb).toBe(true);
    const r = replay(s, [...P(24), ...O(24), ...P(10)]);
    expect(r.done).toBe(true);
    expect(resultString(r)).toBe("6–0  0–6  [10–0]");
  });

  it("flags break points", () => {
    const r = replay(base, [...O(3)]);
    expect(r.ctx.length).toBe(3);
    const r2 = replay(base, [...O(3), ...P(1)]);
    expect(r2.ctx[3]?.bpFor).toBe("o");
  });
});

describe("tennis events", () => {
  it("merges detail taps into their point", () => {
    const ev = (id: string, type: string, data: Record<string, unknown>): MatchEvent => ({ id, seq: 0, at: "", group: id, type, data });
    const pts = mergePoints([
      ev("a", "point", { winner: "p", serve: "first", ending: null, finalShotBy: null }),
      ev("b", "detail", { point: "a", ending: "winner", finalShotBy: "p" }),
      ev("c", "detail", { point: "a", shot: "forehand" })
    ]);
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({ winner: "p", ending: "winner", shot: "forehand" });
  });
});

describe("tennis report", () => {
  it("produces strengths, work-ons and a plan for the sample match", () => {
    const setup: TennisSetup = { player: "A", opponent: "B", competition: "", format: "bo3mtb", noAd: true, firstServer: "p", level: "detailed", endReason: null };
    const pts = simulateMatch(setup);
    const r = replay(setup, pts);
    expect(r.done).toBe(true);
    const ins = tennisInsights(computeTennisStats(pts, r), "A", "B");
    expect(ins.strengths.length).toBeGreaterThan(0);
    expect(ins.workons.map((w) => w.title)).toContain("Backhand breaking down");
    expect(ins.plan[0]?.detail).toContain("backhand");
  });
});
