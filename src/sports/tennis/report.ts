import { pct } from "../../core/insights";
import type { ReportDoc, ReportRow } from "../../core/report";
import type { Match } from "../../core/types";
import { FORMATS, SHOT_LABEL, SHOTS, type P, type TennisSetup } from "./model";
import { resultString, type TennisState } from "./scoring";
import type { TennisInsights, TennisStats } from "./stats";

/** [label, count] or [label, won, out of]. */
export type StatRow = [string, number] | [string, number, number];

/** Serve, return and pressure: the same rows on the report screen and in the PDF. */
export function serveReturnRows(st: TennisStats): StatRow[] {
  return [
    ["Points won", st.won, st.n],
    ["Service points won", st.srv.won, st.srv.n],
    ["Return points won", st.ret.won, st.ret.n],
    ...(st.first.n ? ([["1st serve in", st.first.inn, st.first.n], ["Won on 1st serve", st.first.won, st.first.inn], ["Won on 2nd serve", st.second.won, st.second.n]] as StatRow[]) : []),
    ["Service games held", st.holds.won, st.holds.n],
    ["Return games broken", st.breaks.won, st.breaks.n],
    ["Break points saved", st.bpSaved, st.bpFaced],
    ["Break points converted", st.bpWon, st.bpChances],
    ["Big points won", st.pressure.won, st.pressure.n],
    ["Aces", st.aces],
    ["Double faults", st.dfs]
  ];
}

/** "3 of 5" and "60%" as separate cells; % from fewer than 10 is marked dim. */
export function statCells([label, a, n]: StatRow): ReportRow {
  if (n === undefined) return { cells: [label, String(a), ""] };
  return { cells: [label, `${a} of ${n}`, n ? `${pct(a, n)}%` : "–"], dim: n < 10 ? [2] : [] };
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function tennisReport(m: Match<TennisSetup>, r: TennisState, st: TennisStats, ins: TennisInsights): ReportDoc {
  const s = m.setup;
  const name = (x: P) => (x === "p" ? s.player : s.opponent);
  const shotKeys = SHOTS.map(([k]) => k).filter((k) => st.shots[k] || st.oShots[k]);
  const avgT = st.taps.length ? (st.taps.reduce((a, b) => a + b, 0) / st.taps.length).toFixed(1) : "–";
  return {
    kind: "Tennis match report",
    title: `${s.player} vs ${s.opponent}`,
    meta: [fmtDate(m.createdAt), s.competition, FORMATS[s.format].label + (s.noAd ? ", no-ad" : "")],
    result: resultString(r) || `${r.games.p}–${r.games.o}`,
    resultNote: r.done ? `${name(r.winner!)} won` : s.endReason ? `Ended early: ${s.endReason}` : "In progress",
    sections: [
      {
        kind: "kpis",
        title: "Key numbers",
        items: [
          { label: `Points won (${st.won} of ${st.n})`, value: `${pct(st.won, st.n)}%` },
          { label: "Service games held", value: `${st.holds.won}/${st.holds.n}` },
          { label: "Return games broken", value: `${st.breaks.won}/${st.breaks.n}` },
          { label: "Winners / errors", value: `${st.winners} / ${st.errorsAll}` }
        ]
      },
      {
        kind: "insights",
        title: "Coach's insights",
        groups: [
          { title: "Strengths", items: ins.strengths },
          { title: "Work-ons", items: ins.workons },
          { title: "Game plan for next time", items: ins.plan }
        ]
      },
      {
        kind: "table",
        title: "Serve, return and pressure",
        head: ["", "Count", "%"],
        rows: serveReturnRows(st).map(statCells),
        note: "Percentages in grey come from fewer than 10 points, so read them as a hint rather than a trend."
      },
      {
        kind: "table",
        title: "How points ended",
        head: ["", name("p"), name("o")],
        rows: [
          { cells: ["Winners", String(st.winners), String(st.oWinners)] },
          { cells: ["Aces", String(st.aces), String(st.oAces)] },
          { cells: ["Errors", `${st.errorsAll}${st.ue ? ` (${st.ue} unforced)` : ""}`, String(st.oErr)] },
          { cells: ["Double faults", String(st.dfs), String(st.oDfs)] }
        ]
      },
      ...(shotKeys.length
        ? [{
            kind: "table" as const,
            title: "Final shot",
            head: ["Shot", "Winners", "Errors", `${name("o")} errors`],
            rows: shotKeys.map((k) => ({ cells: [SHOT_LABEL[k], String(st.shots[k]?.w ?? 0), String(st.shots[k]?.e ?? 0), String(st.oShots[k]?.e ?? 0)] }))
          }]
        : []),
      ...(st.sets.length
        ? [{
            kind: "table" as const,
            title: "By set",
            head: ["Set", "Points won", "%", "Winners", "Errors"],
            rows: st.sets.map((x, i) => ({ cells: [`Set ${i + 1}`, `${x.won} of ${x.n}`, `${pct(x.won, x.n)}%`, String(x.winners), String(x.errors)], dim: x.n < 10 ? [2] : [] }))
          }]
        : []),
      {
        kind: "table",
        title: "Capture check",
        head: ["", "Count", "%"],
        rows: [
          statCells(["Points with detail", st.detailCount, st.n]),
          { cells: ["Missed points", String(st.missed), ""] },
          { cells: ["Average taps per point", avgT, ""] }
        ]
      },
      { kind: "text", title: "Notes", body: m.notes ?? "" }
    ]
  };
}
