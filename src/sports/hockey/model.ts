/**
 * Field hockey event model.
 *
 * "for" = our team, "against" = the opposition. A circle entry opens a numbered
 * possession; everything that happens until it ends carries that number, so the
 * attack journey (entry -> shot -> corner -> goal) can be rebuilt later.
 */

export type Side = "for" | "against";
export type EntryLocation = "left" | "topD" | "right";
export type ShotResult = "on" | "off" | "blocked";
export type Zone = "att25" | "mid" | "def25";
export type CardColour = "green" | "yellow" | "red";
export type PcResultFor = "goal" | "saved" | "missed" | "brokenDown";
export type PcResultAgainst = "goal" | "firstWave" | "gkSave" | "secondWave" | "turnoverWon";
export type EndReason = "goal" | "turnover" | "longCorner" | "done" | "defended";

export interface HockeySetup {
  competition: string;
  ourTeam: string;
  opponent: string;
  venue: string;
  /** 2 halves or 4 quarters. */
  format: "2" | "4";
  periodMinutes: number;
}

export type HockeyEventMap = {
  entry: { side: Side; loc: EntryLocation; pos: number };
  shot: { side: Side; result: ShotResult; pos: number | null; fromPc?: boolean };
  /** Goalkeeper save against a shot by the opposition. */
  gkSave: { pos: number | null };
  goal: { side: Side; kind: "field" | "pc" | "stroke"; pos: number | null };
  pc: { side: Side; pos: number | null };
  pcResult: { side: Side; result: PcResultFor | PcResultAgainst; pos: number | null };
  stroke: { side: Side; pos: number | null };
  strokeResult: { side: Side; scored: boolean; pos: number | null };
  longCorner: { side: Side; pos: number | null };
  /** Possession ended by a turnover inside the attack (lost by "for", won back when "against"). */
  turnoverInCircle: { side: Side; pos: number };
  possessionEnd: { side: Side; pos: number; reason: EndReason };
  /** General-play turnover: won = we gained the ball. */
  turnover: { won: boolean; zone: Zone };
  restart16: { side: Side };
  /** side: whose player got the card. Older matches have no side: those were our team's. */
  card: { colour: CardColour; side?: Side };
  period: { to: string };
};

export type HockeyEventType = keyof HockeyEventMap;

export function periodsFor(format: HockeySetup["format"]): string[] {
  return format === "2" ? ["H1", "H2"] : ["Q1", "Q2", "Q3", "Q4"];
}

export const PERIOD_NAMES: Record<string, string> = {
  H1: "1st Half", H2: "2nd Half", Q1: "1st Quarter", Q2: "2nd Quarter", Q3: "3rd Quarter", Q4: "4th Quarter"
};

export const ZONE_LABEL: Record<Zone, string> = { att25: "Attacking 25", mid: "Midfield", def25: "Defensive 25" };
export const LOC_LABEL: Record<EntryLocation, string> = { left: "Left", topD: "Top D", right: "Right" };
