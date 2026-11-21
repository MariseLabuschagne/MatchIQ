import type { MatchEvent } from "../../core/types";
import { LOC_LABEL, ZONE_LABEL, type EntryLocation, type Zone } from "./model";

const SHOT: Record<string, string> = { on: "on target", off: "off target", blocked: "blocked" };
const PC_RESULT: Record<string, string> = {
  goal: "goal", saved: "saved", missed: "missed", brokenDown: "broken down",
  firstWave: "first-wave save", gkSave: "GK save", secondWave: "second-wave save", turnoverWon: "turnover won"
};

/** Plain-language line for one tap (its group of events), for the timeline. */
export function describeTap(group: MatchEvent[], ourTeam: string, opponent: string): string {
  const team = (side: unknown) => (side === "for" ? ourTeam : opponent);
  const main = group.find((e) => e.type !== "possessionEnd" && !(e.type === "shot" && group.some((g) => g.type === "goal" || g.type === "gkSave"))) ?? group[0];
  const d = main.data as Record<string, unknown>;
  switch (main.type) {
    case "entry": return `${team(d.side)} circle entry · ${LOC_LABEL[d.loc as EntryLocation]}`;
    case "shot": return `${team(d.side)} shot ${SHOT[String(d.result)]}${d.fromPc ? " (from PC)" : ""}`;
    case "gkSave": return `Goalkeeper save`;
    case "goal": return `GOAL ${team(d.side)}${d.kind === "pc" ? " (penalty corner)" : d.kind === "stroke" ? " (penalty stroke)" : ""}`;
    case "pc": return `${team(d.side)} penalty corner`;
    case "pcResult": return `${team(d.side)} PC ${PC_RESULT[String(d.result)]}`;
    case "stroke": return `${team(d.side)} penalty stroke`;
    case "strokeResult": return `Penalty stroke ${d.scored ? "scored" : "missed"}`;
    case "longCorner": return `${team(d.side)} long corner`;
    case "turnoverInCircle": return d.side === "for" ? "Turnover lost in the circle" : "Turnover won in our circle";
    case "possessionEnd": return d.side === "for" ? "Attack ended" : "Defence ended";
    case "turnover": return `Turnover ${d.won ? "won" : "lost"} · ${ZONE_LABEL[d.zone as Zone]}`;
    case "restart16": return `${team(d.side)} 16-yard hit`;
    case "card": return `${String(d.colour).replace(/^./, (c) => c.toUpperCase())} card · ${team(d.side ?? "for")}`;
    case "period": return `Start of ${String(d.to)}`;
    default: return main.type;
  }
}
