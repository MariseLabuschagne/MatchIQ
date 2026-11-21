import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { drawReport } from "../src/core/report";
import { appendEvents } from "../src/core/events";
import type { Match } from "../src/core/types";
import { convertLegacyHockey, type LegacyMatch } from "../src/sports/hockey/legacy";
import { computeStats } from "../src/sports/hockey/stats";
import { hockeyInsights } from "../src/sports/hockey/insights";
import { hockeyReport } from "../src/sports/hockey/report";
import type { HockeySetup } from "../src/sports/hockey/model";
import { mergePoints, type TennisSetup } from "../src/sports/tennis/model";
import { replay } from "../src/sports/tennis/scoring";
import { simulateMatch } from "../src/sports/tennis/simulate";
import { computeTennisStats, tennisInsights } from "../src/sports/tennis/stats";
import { tennisReport } from "../src/sports/tennis/report";

/** Set REPORT_OUT=<folder> to write the sample PDFs and look at them. */
const OUT = process.env.REPORT_OUT;
const logo = { data: `data:image/jpeg;base64,${readFileSync("public/matchiq-logo.jpeg").toString("base64")}`, ratio: 1 };

const ev = (n: number, eventType: string, period: string, matchSecond: number) => ({ id: `e${n}`, eventType, period, matchSecond, timestamp: "2026-08-02T09:00:00.000Z" });

function render(doc: Parameters<typeof drawReport>[1], name: string): number {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  drawReport(pdf, doc, logo);
  if (OUT) writeFileSync(`${OUT}/${name}.pdf`, Buffer.from(pdf.output("arraybuffer")));
  return pdf.getNumberOfPages();
}

describe("PDF match reports", () => {
  it("lays out a hockey report", () => {
    const m = convertLegacyHockey({
      id: "a", sport: "hockey", createdAt: "2026-08-02T09:00:00.000Z", completedAt: "2026-08-02T10:10:00.000Z",
      competition: "League", ourTeam: "U14A", opponent: "Northside", venue: "Home", format: "4", periodLength: "15",
      events: [
        ev(1, "entryTopD", "Q1", 120), ev(2, "shotOnTarget", "Q1", 130), ev(3, "goalScored", "Q1", 135),
        ev(4, "entryLeft", "Q2", 300), ev(5, "entryPenaltyCorner", "Q2", 310), ev(6, "pcSaved", "Q2", 330),
        ev(7, "defenceEntryRight", "Q3", 200), ev(8, "goalConceded", "Q3", 210),
        ev(9, "entryRight", "Q4", 400), ev(10, "shotOnTarget", "Q4", 410), ev(11, "goalScored", "Q4", 415)
      ]
    } as unknown as LegacyMatch) as Match<HockeySetup>;
    m.notes = "Wet pitch. Two starters out with flu; Mia played centre half for the first time.";
    const stats = computeStats(m.setup, m.events);
    const doc = hockeyReport(m, stats, hockeyInsights(stats), 0);
    expect(doc.result).toContain("2 – 1");
    expect(render(doc, "hockey-report")).toBeGreaterThanOrEqual(2);
  });

  it("lays out a tennis report", () => {
    const setup: TennisSetup = { player: "Mia", opponent: "Zoe", competition: "Inter-schools", format: "bo3mtb", noAd: true, firstServer: "p", level: "detailed", endReason: null };
    const now = "2026-11-21T09:00:00.000Z";
    let m: Match = { id: "t", sport: "tennis", schemaVersion: 1, createdAt: now, updatedAt: now, completedAt: now, status: "completed", setup, events: [], clock: { periodMinutes: 0, runningSince: null, banked: 0 } };
    for (const pt of simulateMatch(setup)) {
      const { id: _id, ...rest } = pt;
      void _id;
      m = appendEvents(m, [{ type: "point", data: rest as Record<string, unknown> }]);
    }
    const tm = m as Match<TennisSetup>;
    const points = mergePoints(tm.events), r = replay(setup, points), st = computeTennisStats(points, r);
    const doc = tennisReport(tm, r, st, tennisInsights(st, "Mia", "Zoe"));
    expect(doc.sections.some((s) => s.kind === "table" && s.head.join() === ",Count,%")).toBe(true);
    expect(render(doc, "tennis-report")).toBeGreaterThanOrEqual(1);
  });
});
