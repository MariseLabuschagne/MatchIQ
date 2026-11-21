import type { ReportDoc } from "../../core/report";
import type { Match } from "../../core/types";
import type { HockeyInsights } from "./insights";
import type { HockeySetup } from "./model";
import { effectiveness, type HockeyStats } from "./stats";
import { HOCKEY_TABLES } from "./tables";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** The hockey match report as data, for the PDF (core/report.ts). Same numbers as the summary screen. */
export function hockeyReport(match: Match<HockeySetup>, stats: HockeyStats, ins: HockeyInsights, _historyCount: number): ReportDoc {
  const s = match.setup, t = stats.total, eff = effectiveness(t);
  const gf = t.goals.for.total, ga = t.goals.against.total;
  const outcome = match.status === "active" ? "Match in progress" : gf > ga ? `${s.ourTeam} won` : gf < ga ? `${s.opponent} won` : "Draw";
  return {
    kind: "Hockey match report",
    title: `${s.ourTeam} vs ${s.opponent}`,
    meta: [fmtDate(match.createdAt), s.competition, s.venue, `${s.format === "2" ? "2 halves" : "4 quarters"} of ${s.periodMinutes} min`],
    result: `${s.ourTeam}  ${gf} – ${ga}  ${s.opponent}`,
    resultNote: outcome,
    sections: [
      {
        kind: "kpis",
        title: "Attack journey",
        items: [
          { label: "Circle entries", value: String(t.entries.for.total) },
          { label: `Led to a shot (${eff.entryToShot}%)`, value: String(t.possWithShot.for) },
          { label: `Shots on target (${eff.shotAccuracy}% accuracy)`, value: String(t.shots.for.on) },
          { label: `Goals (${eff.entryToGoal}% of entries)`, value: String(gf) }
        ]
      },
      {
        kind: "insights",
        title: "Coach's insights",
        groups: [
          { title: "Strengths", items: ins.strengths },
          { title: "Work-ons", items: ins.workons },
          { title: "Game plan", items: ins.plan }
        ]
      },
      ...HOCKEY_TABLES.map((tb) => ({
        kind: "table" as const,
        title: tb.title,
        head: ["", ...stats.periods, "Total"],
        boldLast: true,
        rows: tb.rows.map((r) => ({
          indent: r.indent,
          head: r.head,
          cells: [r.label, ...stats.periods.map((p) => (r.head ? "" : String(r.v(stats.byPeriod[p])))), r.head ? "" : String(r.v(t))]
        }))
      })),
      { kind: "text", title: "Notes", body: match.notes ?? "" }
    ]
  };
}
