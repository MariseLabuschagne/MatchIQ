import { pct } from "../../core/insights";
import type { Match } from "../../core/types";
import { SeasonChart } from "../../core/ui/Chart";
import type { HockeySetup } from "./model";
import { computeStats } from "./stats";

/** Logo green for us, a quiet grey for the other side. */
const US = "#5fa82a", THEM = "#94a3b8";
const short = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Season view for one team: record, totals and per-match charts. `matches` are completed, oldest first. */
export function HockeySeason({ matches }: { matches: Match<HockeySetup>[] }) {
  const rows = matches.map((m) => ({ m, t: computeStats(m.setup, m.events).total }));
  let w = 0, d = 0, l = 0, gf = 0, ga = 0, entries = 0, withShot = 0, pcs = 0, pcGoals = 0, entriesAg = 0, ent = 0;
  for (const { t } of rows) {
    const f = t.goals.for.total, a = t.goals.against.total;
    if (f > a) w++; else if (f < a) l++; else d++;
    gf += f; ga += a;
    entries += t.entries.for.total; withShot += t.possWithShot.for;
    pcs += t.pcs.for; pcGoals += t.goals.for.pc;
    entriesAg += t.entries.against.total; ent += t.entries.against.total - t.possWithShot.against;
  }
  const n = rows.length;
  const groups = (pick: (t: (typeof rows)[number]["t"]) => [number, number]) =>
    rows.map(({ m, t }) => ({ label: short(m.createdAt), detail: `${short(m.createdAt)} vs ${m.setup.opponent}`, values: pick(t) }));

  return (
    <>
      <div className="kpis season-kpis">
        <div className="kpi"><div className="v">{w}–{d}–{l}</div><div className="l">Won–drawn–lost ({n} {n === 1 ? "match" : "matches"})</div></div>
        <div className="kpi"><div className="v">{gf}–{ga}</div><div className="l">Goals for–against ({(gf / n).toFixed(1)}–{(ga / n).toFixed(1)} a match)</div></div>
        <div className="kpi"><div className="v">{pct(withShot, entries)}%</div><div className="l">Circle entries that led to a shot ({withShot} of {entries})</div></div>
        <div className="kpi"><div className="v">{pct(ent, entriesAg)}%</div><div className="l">Entries against kept to no shot ({ent} of {entriesAg})</div></div>
        <div className="kpi"><div className="v">{pct(pcGoals, pcs)}%</div><div className="l">Penalty corners scored ({pcGoals} of {pcs})</div></div>
      </div>
      <div className="season-charts">
      <SeasonChart title="Goals per match" series={[{ name: "Scored", color: US }, { name: "Conceded", color: THEM }]}
        groups={groups((t) => [t.goals.for.total, t.goals.against.total])} />
      <SeasonChart title="Circle entries per match" series={[{ name: "Ours", color: US }, { name: "Against", color: THEM }]}
        groups={groups((t) => [t.entries.for.total, t.entries.against.total])} />
      </div>
    </>
  );
}
