import { uid } from "../../core/events";
import { newClock } from "../../core/clock";
import { SCHEMA_VERSION, type Match, type MatchEvent } from "../../core/types";
import type { HockeySetup, Side } from "./model";

/**
 * Converts a v2 (legacy) hockey match into the v3 model.
 * v2 stored one flat list of event ids (entryLeft, shotOnTarget, pcGoal, ...);
 * v3 stores typed events with an explicit possession number.
 */

interface LegacyEvent {
  id?: string;
  timestamp?: string;
  matchSecond?: number;
  period?: string;
  eventType: string;
  attackId?: number | null;
  value?: unknown;
}

export interface LegacyMatch {
  id?: string;
  createdAt?: string;
  completedAt?: string | null;
  competition?: string;
  ourTeam?: string;
  opponent?: string;
  venue?: string;
  format?: string;
  periodLength?: string | number;
  sport?: string;
  events?: LegacyEvent[];
}

const ZONE: Record<string, "att25" | "mid" | "def25"> = {
  turnoverAttacking25: "att25", turnoverMidfield: "mid", turnoverDefensive25: "def25",
  turnoverAttacking25Lost: "att25", turnoverMidfieldLost: "mid", turnoverDefensive25Lost: "def25"
};

export function isLegacyHockey(raw: LegacyMatch): boolean {
  return (raw.sport ?? "hockey") === "hockey" && Array.isArray(raw.events);
}

export function convertLegacyHockey(raw: LegacyMatch): Match<HockeySetup> | null {
  if (!isLegacyHockey(raw)) return null;
  const format: "2" | "4" = String(raw.format) === "2" ? "2" : "4";
  const setup: HockeySetup = {
    competition: raw.competition ?? "",
    ourTeam: raw.ourTeam ?? "Our team",
    opponent: raw.opponent ?? "Opponent",
    venue: raw.venue ?? "",
    format,
    periodMinutes: Number(raw.periodLength) || 15
  };

  const out: MatchEvent[] = [];
  let seq = 0;
  let period = format === "2" ? "H1" : "Q1";
  let pos = 0;
  let open: { side: Side; pos: number; pcPending: boolean } | null = null;
  const legacyToPos = new Map<number, number>();

  const push = (type: string, d: Record<string, unknown>, src: LegacyEvent, group: string) => {
    out.push({
      id: uid(), seq: ++seq, at: src.timestamp ?? raw.createdAt ?? new Date().toISOString(), group, type, data: d,
      clock: { period, second: src.matchSecond ?? 0 }
    });
  };
  const end = (reason: string, src: LegacyEvent, group: string) => {
    if (open) push("possessionEnd", { side: open.side, pos: open.pos, reason }, src, group);
    open = null;
  };
  const posFor = (side: Side): number | null => (open && open.side === side ? open.pos : null);

  for (const e of raw.events ?? []) {
    const g = uid();
    if (e.period && e.period !== period) {
      end("done", e, g);
      period = e.period;
      push("period", { to: period }, e, g);
    }
    const t = e.eventType;
    switch (t) {
      case "entryLeft": case "entryTopD": case "entryRight": {
        end("done", e, g);
        const legacyId = typeof e.attackId === "number" ? e.attackId : null;
        pos++;
        if (legacyId != null) legacyToPos.set(legacyId, pos);
        open = { side: "for", pos, pcPending: false };
        push("entry", { side: "for", loc: t === "entryLeft" ? "left" : t === "entryTopD" ? "topD" : "right", pos }, e, g);
        break;
      }
      case "defenceEntryLeft": case "defenceEntryTopD": case "defenceEntryRight":
        end("done", e, g);
        pos++;
        open = { side: "against", pos, pcPending: false };
        push("entry", { side: "against", loc: t === "defenceEntryLeft" ? "left" : t === "defenceEntryTopD" ? "topD" : "right", pos }, e, g);
        break;
      case "shotOnTarget": case "shotOffTarget": case "shotBlocked": {
        const p = posFor("for");
        push("shot", { side: "for", result: t === "shotOnTarget" ? "on" : t === "shotOffTarget" ? "off" : "blocked", pos: p, fromPc: open?.pcPending || undefined }, e, g);
        break;
      }
      case "goalScored":
        push("goal", { side: "for", kind: "field", pos: posFor("for") }, e, g);
        if (open?.side === "for") end("goal", e, g);
        break;
      case "entryPenaltyCorner": case "pcWon":
        push("pc", { side: "for", pos: posFor("for") }, e, g);
        if (open?.side === "for") open.pcPending = true;
        break;
      case "pcGoal":
        push("pcResult", { side: "for", result: "goal", pos: posFor("for") }, e, g);
        push("goal", { side: "for", kind: "pc", pos: posFor("for") }, e, g);
        if (open?.side === "for") end("goal", e, g);
        break;
      case "pcSaved": case "pcMissed": case "pcBrokenDown":
        push("pcResult", { side: "for", result: t === "pcSaved" ? "saved" : t === "pcMissed" ? "missed" : "brokenDown", pos: posFor("for") }, e, g);
        if (open) open.pcPending = false;
        break;
      case "psWon":
        push("stroke", { side: "for", pos: posFor("for") }, e, g);
        break;
      case "entryLongCorner":
        push("longCorner", { side: "for", pos: posFor("for") }, e, g);
        if (open?.side === "for") end("longCorner", e, g);
        break;
      case "longCorner":
        end("done", e, g);
        push("longCorner", { side: "for", pos: null }, e, g);
        break;
      case "longCornerAgainst":
        end("done", e, g);
        push("longCorner", { side: "against", pos: null }, e, g);
        break;
      case "entryTurnoverLost":
        if (open?.side === "for") {
          push("turnoverInCircle", { side: "for", pos: open.pos }, e, g);
          end("turnover", e, g);
        }
        break;
      case "turnoverAttacking25": case "turnoverMidfield": case "turnoverDefensive25":
        end("done", e, g);
        push("turnover", { won: true, zone: ZONE[t] }, e, g);
        break;
      case "turnoverAttacking25Lost": case "turnoverMidfieldLost": case "turnoverDefensive25Lost":
        end("done", e, g);
        push("turnover", { won: false, zone: ZONE[t] }, e, g);
        break;
      case "restart16": case "restart16Against":
        end("done", e, g);
        push("restart16", { side: t === "restart16" ? "for" : "against" }, e, g);
        break;
      case "goalConceded":
        push("goal", { side: "against", kind: "field", pos: posFor("against") }, e, g);
        if (open?.side === "against") end("goal", e, g);
        break;
      case "save":
        push("shot", { side: "against", result: "on", pos: posFor("against") }, e, g);
        push("gkSave", { pos: posFor("against") }, e, g);
        break;
      case "pcConceded":
        push("pc", { side: "against", pos: posFor("against") }, e, g);
        if (open?.side === "against") open.pcPending = true;
        break;
      case "pcGoalConceded":
        push("pcResult", { side: "against", result: "goal", pos: posFor("against") }, e, g);
        push("goal", { side: "against", kind: "pc", pos: posFor("against") }, e, g);
        if (open?.side === "against") end("goal", e, g);
        break;
      case "pcFirstWaveSave": case "pcGoalkeeperSave":
        push("pcResult", { side: "against", result: t === "pcFirstWaveSave" ? "firstWave" : "gkSave", pos: posFor("against") }, e, g);
        break;
      case "pcSecondWaveSave":
        push("pcResult", { side: "against", result: "secondWave", pos: posFor("against") }, e, g);
        if (open?.side === "against") end("defended", e, g);
        break;
      case "turnoverWonDefence":
        if (open?.side === "against" && open.pcPending) push("pcResult", { side: "against", result: "turnoverWon", pos: open.pos }, e, g);
        else push("turnoverInCircle", { side: "against", pos: posFor("against") }, e, g);
        if (open?.side === "against") end("defended", e, g);
        break;
      case "psConceded":
        push("stroke", { side: "against", pos: posFor("against") }, e, g);
        break;
      case "greenCard": case "yellowCard": case "redCard":
        push("card", { colour: t === "greenCard" ? "green" : t === "yellowCard" ? "yellow" : "red" }, e, g);
        break;
      default:
        // attackStart, defenceEntry, periodChanged and softball ids carry no extra information.
        break;
    }
  }
  if (open) end("done", raw.events?.[raw.events.length - 1] ?? { eventType: "end" }, uid());

  const created = raw.createdAt ?? new Date().toISOString();
  return {
    id: raw.id ?? uid(),
    sport: "hockey",
    schemaVersion: SCHEMA_VERSION,
    createdAt: created,
    updatedAt: raw.completedAt ?? created,
    completedAt: raw.completedAt ?? created,
    status: "completed",
    setup,
    events: out,
    clock: newClock(setup.periodMinutes),
    importedFrom: "v2"
  };
}

/** The v2 score rule, used to check a conversion. */
export function legacyScore(raw: LegacyMatch): { for: number; against: number } {
  const n = (id: string) => (raw.events ?? []).filter((e) => e.eventType === id).length;
  return { for: n("goalScored") + n("pcGoal"), against: n("goalConceded") + n("pcGoalConceded") };
}
