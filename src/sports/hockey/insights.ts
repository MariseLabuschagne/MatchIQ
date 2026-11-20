import { frac, InsightCollector, pct, plural } from "../../core/insights";
import type { Insight } from "../../core/types";
import { LOC_LABEL, PERIOD_NAMES, type EntryLocation, type Zone } from "./model";
import { effectiveness, type HockeyCounts, type HockeyStats } from "./stats";

export interface HockeyInsights {
  strengths: Insight[];
  workons: Insight[];
  plan: Insight[];
}

function topLoc(e: { left: number; topD: number; right: number; total: number }): [EntryLocation, number] {
  const locs: EntryLocation[] = ["left", "topD", "right"];
  const best = locs.reduce((a, b) => (e[b] > e[a] ? b : a));
  return [best, e[best]];
}

function topZone(t: { att25: number; mid: number; def25: number }): [Zone, number] {
  const zones: Zone[] = ["att25", "mid", "def25"];
  const best = zones.reduce((a, b) => (t[b] > t[a] ? b : a));
  return [best, t[best]];
}

/**
 * Rules for the coach report. Each rule needs a minimum sample before it speaks,
 * and is ranked by how many entries, shots or goals the pattern is worth.
 * `history` = total counts of this team's previous matches (newest first), for "compared with usual".
 */
export function hockeyInsights(stats: HockeyStats, history: HockeyCounts[] = []): HockeyInsights {
  const c = stats.total;
  const eff = effectiveness(c);
  const ins = new InsightCollector();
  const ef = c.entries.for, ea = c.entries.against;

  // Attack: creating and converting chances
  if (ef.total >= 6 && eff.entryToShot >= 50) ins.add("strength", c.possWithShot.for, "Turning entries into shots", `${frac(c.possWithShot.for, ef.total)} circle entries produced a shot.`);
  if (ef.total >= 6 && eff.entryToShot < 35) ins.add("workon", ef.total - c.possWithShot.for, "Entries without a shot", `Only ${frac(c.possWithShot.for, ef.total)} circle entries produced a shot. Work on getting a shot away quickly after entering.`);
  if (c.shots.for.total >= 6 && eff.shotAccuracy < 40) ins.add("workon", c.shots.for.total - c.shots.for.on, "Shooting accuracy", `${frac(c.shots.for.on, c.shots.for.total)} shots were on target.`);
  if (c.shots.for.total >= 6 && eff.shotAccuracy >= 60) ins.add("strength", c.shots.for.on, "Accurate shooting", `${frac(c.shots.for.on, c.shots.for.total)} shots were on target.`);
  if (c.shots.for.blocked >= 4 && c.shots.for.blocked >= c.shots.for.total * 0.4) ins.add("workon", c.shots.for.blocked, "Shots being blocked", `${plural(c.shots.for.blocked, "shot")} blocked out of ${c.shots.for.total}. Create space or shoot earlier.`);
  if (c.pcs.for >= 3 && eff.pcConversion >= 33) ins.add("strength", c.goals.for.pc * 2, "Penalty corner routine", `Scored from ${frac(c.goals.for.pc, c.pcs.for)} penalty corners.`);
  if (c.pcs.for >= 4 && c.goals.for.pc === 0) ins.add("workon", c.pcs.for, "Penalty corner conversion", `No goals from ${plural(c.pcs.for, "penalty corner")}${c.pcFor.brokenDown ? `; ${c.pcFor.brokenDown} broke down` : ""}.`);
  if (c.circleTurnovers.for >= 4 && c.circleTurnovers.for >= ef.total * 0.4) ins.add("workon", c.circleTurnovers.for, "Losing the ball in the circle", `${frac(c.circleTurnovers.for, ef.total)} attacks ended with a turnover in the circle.`);

  // Entry patterns
  if (ef.total >= 5) {
    const [loc, n] = topLoc(ef);
    if (n / ef.total >= 0.6) ins.add("plan", n, `Attack leans ${LOC_LABEL[loc].toLowerCase()}`, `${frac(n, ef.total)} entries came from the ${LOC_LABEL[loc]}. Good if it works; predictable if it doesn't.`);
  }
  if (ea.total >= 5) {
    const [loc, n] = topLoc(ea);
    if (n / ea.total >= 0.5) ins.add("plan", n, `Opposition attacks down the ${LOC_LABEL[loc].toLowerCase()}`, `${frac(n, ea.total)} entries against came from the ${LOC_LABEL[loc]}. Strengthen that channel.`);
  }

  // Defence
  if (ea.total >= 6 && ea.total >= Math.max(ef.total, 1) * 1.5) ins.add("workon", ea.total - ef.total, "Territory", `${ea.total} circle entries against and ${ef.total} for. The opposition spent more time in our circle.`);
  if (ea.total >= 6 && eff.entriesDefended >= 65) ins.add("strength", ea.total - c.possWithShot.against, "Defending the circle", `${frac(ea.total - c.possWithShot.against, ea.total)} entries against ended without a shot.`);
  if (c.pcs.against >= 3) {
    const stopped = c.pcAgainst.firstWave + c.pcAgainst.gkSave + c.pcAgainst.secondWave + c.pcAgainst.turnoverWon;
    if (c.pcAgainst.goal === 0) ins.add("strength", c.pcs.against, "Penalty corner defence", `Conceded no goals from ${plural(c.pcs.against, "penalty corner")}.`);
    else if (c.pcAgainst.goal / c.pcs.against >= 0.34) ins.add("workon", c.pcAgainst.goal * 2, "Penalty corner defence", `Conceded ${frac(c.pcAgainst.goal, c.pcs.against)} penalty corners; ${stopped} stopped.`);
  }
  if (c.pcs.against >= 4 && c.pcs.against > c.pcs.for * 2) ins.add("workon", c.pcs.against, "Giving away penalty corners", `${c.pcs.against} penalty corners conceded and ${c.pcs.for} won. Defend without fouling in the circle.`);
  if (c.gkSaves >= 4) ins.add("strength", c.gkSaves, "Goalkeeper", `${plural(c.gkSaves, "save")} from open play.`);

  // Turnovers
  if (c.turnoversWon.total + c.turnoversLost.total >= 8) {
    const diff = c.turnoversWon.total - c.turnoversLost.total;
    if (diff >= 3) ins.add("strength", diff, "Winning the ball back", `${c.turnoversWon.total} turnovers won and ${c.turnoversLost.total} lost.`);
    if (diff <= -3) ins.add("workon", -diff, "Giving the ball away", `${c.turnoversLost.total} turnovers lost and ${c.turnoversWon.total} won.`);
  }
  if (c.turnoversLost.def25 >= 3) ins.add("workon", c.turnoversLost.def25 * 1.5, "Turnovers in our own 25", `Lost the ball ${c.turnoversLost.def25} times in the defensive 25, the most dangerous place to lose it.`);
  if (c.turnoversWon.total >= 5) {
    const [z, n] = topZone(c.turnoversWon);
    if (z === "att25" && n >= 3) ins.add("strength", n, "High press", `Won the ball ${n} times in the attacking 25.`);
  }

  // Through the match
  const ps = stats.periods.map((p) => stats.byPeriod[p]).filter((p) => p.events > 0);
  if (ps.length >= 2) {
    const first = ps[0], last = ps[ps.length - 1];
    const lastName = PERIOD_NAMES[stats.periods[ps.length - 1]] ?? "last period";
    if (first.entries.for.total >= 4 && last.entries.for.total <= first.entries.for.total / 2) ins.add("workon", first.entries.for.total - last.entries.for.total, "Attack faded late", `Circle entries dropped from ${first.entries.for.total} in the first period to ${last.entries.for.total} in the ${lastName.toLowerCase()}. Check fitness and rotation.`);
    if (last.goals.against.total >= 2 && last.goals.against.total > c.goals.against.total / 2) ins.add("workon", last.goals.against.total * 2, "Late goals conceded", `${last.goals.against.total} of ${c.goals.against.total} goals against came in the ${lastName.toLowerCase()}.`);
  }

  // Discipline
  if (c.cards.yellow + c.cards.red >= 1 || c.cards.total >= 3) ins.add("workon", c.cards.yellow * 2 + c.cards.red * 4 + c.cards.green, "Discipline", `${plural(c.cards.total, "card")}: ${c.cards.green} green, ${c.cards.yellow} yellow, ${c.cards.red} red. Time a player down hurts.`);

  // Compared with this team's usual
  if (history.length >= 3) {
    const avg = (f: (h: HockeyCounts) => number) => history.reduce((s, h) => s + f(h), 0) / history.length;
    const avgEntries = avg((h) => h.entries.for.total);
    const avgShotRate = avg((h) => pct(h.possWithShot.for, h.entries.for.total));
    const avgAgainst = avg((h) => h.entries.against.total);
    const n = history.length;
    if (avgEntries >= 4 && ef.total >= avgEntries * 1.3) ins.add("strength", ef.total - avgEntries, "More entries than usual", `${ef.total} circle entries against an average of ${avgEntries.toFixed(1)} over the last ${n} matches.`);
    if (avgEntries >= 4 && ef.total <= avgEntries * 0.7) ins.add("workon", avgEntries - ef.total, "Fewer entries than usual", `${ef.total} circle entries against an average of ${avgEntries.toFixed(1)} over the last ${n} matches.`);
    if (ef.total >= 6 && eff.entryToShot >= avgShotRate + 15) ins.add("strength", (eff.entryToShot - avgShotRate) / 5, "Sharper in the circle than usual", `Entry to shot ${eff.entryToShot}%, usually ${Math.round(avgShotRate)}%.`);
    if (avgAgainst >= 4 && ea.total >= avgAgainst * 1.4) ins.add("workon", ea.total - avgAgainst, "More pressure than usual", `${ea.total} entries against, usually ${avgAgainst.toFixed(1)}.`);
  }

  return { strengths: ins.top("strength"), workons: ins.top("workon"), plan: ins.top("plan", 2) };
}

