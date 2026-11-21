import { pct } from "../../core/insights";
import type { Match } from "../../core/types";
import { SeasonChart } from "../../core/ui/Chart";
import { mergePoints, type TennisSetup } from "./model";
import { replay } from "./scoring";
import { computeTennisStats } from "./stats";

const short = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Season view for one player: record, totals and points won per match. `matches` are completed, oldest first. */
export function TennisSeason({ matches }: { matches: Match<TennisSetup>[] }) {
  const rows = matches.map((m) => {
    const points = mergePoints(m.events), r = replay(m.setup, points);
    return { m, r, st: computeTennisStats(points, r) };
  });
  let w = 0, l = 0, won = 0, n = 0, fIn = 0, fN = 0, hold = 0, holdN = 0, brk = 0, brkN = 0;
  for (const { r, st } of rows) {
    if (r.winner === "p") w++; else if (r.winner === "o") l++;
    won += st.won; n += st.n; fIn += st.first.inn; fN += st.first.n;
    hold += st.holds.won; holdN += st.holds.n; brk += st.breaks.won; brkN += st.breaks.n;
  }
  return (
    <>
      <div className="kpis season-kpis">
        <div className="kpi"><div className="v">{w}–{l}</div><div className="l">Won–lost ({rows.length} {rows.length === 1 ? "match" : "matches"})</div></div>
        <div className="kpi"><div className="v">{pct(won, n)}%</div><div className="l">Points won ({won} of {n})</div></div>
        <div className="kpi"><div className="v">{pct(hold, holdN)}%</div><div className="l">Service games held ({hold} of {holdN})</div></div>
        <div className="kpi"><div className="v">{pct(brk, brkN)}%</div><div className="l">Return games broken ({brk} of {brkN})</div></div>
        {fN > 0 && <div className="kpi"><div className="v">{pct(fIn, fN)}%</div><div className="l">First serves in ({fIn} of {fN})</div></div>}
      </div>
      <SeasonChart title="Points won per match (%)" series={[{ name: "Points won", color: "#0d9488" }]} max={100}
        reference={{ value: 50, label: "50%" }} format={(v) => `${Math.round(v)}%`}
        groups={rows.map(({ m, st }) => ({ label: short(m.createdAt), detail: `${short(m.createdAt)} vs ${m.setup.opponent}`, values: [st.n ? pct(st.won, st.n) : null] }))} />
    </>
  );
}
