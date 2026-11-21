import { pct } from "../../core/insights";
import type { HockeyCounts } from "./stats";

/** A row in a by-period table. Shared by the summary screen and the PDF report. */
export interface Row {
  label: string;
  indent?: 0 | 1 | 2;
  head?: boolean;
  v: (c: HockeyCounts) => number | string;
}

const P = (a: number, n: number) => `${pct(a, n)}%`;

export const HOCKEY_TABLES: { title: string; rows: Row[] }[] = [
  {
    title: "Attack analysis",
    rows: [
    { label: "Circle entries", v: (c) => c.entries.for.total },
    { label: "Left", indent: 1, v: (c) => c.entries.for.left },
    { label: "Top D", indent: 1, v: (c) => c.entries.for.topD },
    { label: "Right", indent: 1, v: (c) => c.entries.for.right },
    { label: "Shots", v: (c) => c.shots.for.total },
    { label: "On target", indent: 1, v: (c) => c.shots.for.on },
    { label: "Off target", indent: 1, v: (c) => c.shots.for.off },
    { label: "Blocked", indent: 1, v: (c) => c.shots.for.blocked },
    { label: "Attack outcomes", head: true, v: () => "" },
    { label: "Penalty corners", indent: 1, v: (c) => c.pcs.for },
    { label: "Converted", indent: 2, v: (c) => c.pcFor.goal },
    { label: "Saved", indent: 2, v: (c) => c.pcFor.saved },
    { label: "Missed", indent: 2, v: (c) => c.pcFor.missed },
    { label: "Broken down", indent: 2, v: (c) => c.pcFor.brokenDown },
    { label: "Long corners", indent: 1, v: (c) => c.longCorners.for },
    { label: "Penalty strokes", indent: 1, v: (c) => c.strokes.for },
    { label: "Turnovers lost in circle", indent: 1, v: (c) => c.circleTurnovers.for },
    { label: "Goals scored", v: (c) => c.goals.for.total },
    { label: "Field goals", indent: 1, v: (c) => c.goals.for.field },
    { label: "PC goals", indent: 1, v: (c) => c.goals.for.pc },
    { label: "Stroke goals", indent: 1, v: (c) => c.goals.for.stroke },
    { label: "Turnovers won", v: (c) => c.turnoversWon.total },
    { label: "Attacking 25", indent: 1, v: (c) => c.turnoversWon.att25 },
    { label: "Midfield", indent: 1, v: (c) => c.turnoversWon.mid },
    { label: "Defensive 25", indent: 1, v: (c) => c.turnoversWon.def25 },
    { label: "16-yard hits", v: (c) => c.restart16.for }
    ]
  },
  {
    title: "Attacking effectiveness",
    rows: [
    { label: "Entry → shot %", v: (c) => P(c.possWithShot.for, c.entries.for.total) },
    { label: "Entry → goal %", v: (c) => P(c.possWithGoal.for, c.entries.for.total) },
    { label: "Shot accuracy %", v: (c) => P(c.shots.for.on, c.shots.for.total) },
    { label: "Field goal conversion %", v: (c) => P(c.goals.for.field, c.shots.for.on) },
    { label: "PC conversion %", v: (c) => P(c.goals.for.pc, c.pcs.for) }
    ]
  },
  {
    title: "Defence analysis",
    rows: [
    { label: "Circle entries against", v: (c) => c.entries.against.total },
    { label: "Left", indent: 1, v: (c) => c.entries.against.left },
    { label: "Top D", indent: 1, v: (c) => c.entries.against.topD },
    { label: "Right", indent: 1, v: (c) => c.entries.against.right },
    { label: "Entries defended (no shot) %", v: (c) => P(c.entries.against.total - c.possWithShot.against, c.entries.against.total) },
    { label: "Shots against", v: (c) => c.shots.against.total },
    { label: "Goals conceded", v: (c) => c.goals.against.total },
    { label: "Goalkeeper saves", v: (c) => c.gkSaves },
    { label: "Turnovers won in our circle", v: (c) => c.circleTurnovers.against },
    { label: "Turnovers lost", v: (c) => c.turnoversLost.total },
    { label: "Attacking 25", indent: 1, v: (c) => c.turnoversLost.att25 },
    { label: "Midfield", indent: 1, v: (c) => c.turnoversLost.mid },
    { label: "Defensive 25", indent: 1, v: (c) => c.turnoversLost.def25 },
    { label: "Long corners against", v: (c) => c.longCorners.against },
    { label: "Penalty corners conceded", v: (c) => c.pcs.against },
    { label: "Goals", indent: 1, v: (c) => c.pcAgainst.goal },
    { label: "First-wave saves", indent: 1, v: (c) => c.pcAgainst.firstWave },
    { label: "GK saves", indent: 1, v: (c) => c.pcAgainst.gkSave },
    { label: "Second-wave saves", indent: 1, v: (c) => c.pcAgainst.secondWave },
    { label: "Turnovers won", indent: 1, v: (c) => c.pcAgainst.turnoverWon },
    { label: "Penalty strokes conceded", v: (c) => c.strokes.against },
    { label: "16-yard hits against", v: (c) => c.restart16.against }
    ]
  },
  {
    title: "Discipline",
    rows: [
    { label: "Green cards", v: (c) => c.cards.green },
    { label: "Yellow cards", v: (c) => c.cards.yellow },
    { label: "Red cards", v: (c) => c.cards.red }
    ]
  }
];
