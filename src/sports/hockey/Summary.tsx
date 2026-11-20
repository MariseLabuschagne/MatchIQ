import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../core/auth/AuthProvider";
import { formatClock } from "../../core/clock";
import { downloadCsv, exportPdf, safeName } from "../../core/export";
import { pct } from "../../core/insights";
import { navigate } from "../../core/router";
import { listLocal } from "../../core/storage/local";
import { InsightList, Topbar } from "../../core/ui/components";
import type { Match } from "../../core/types";
import type { MatchSession } from "../../core/useMatch";
import { describeTap } from "./describe";
import { hockeyInsights } from "./insights";
import { type HockeySetup } from "./model";
import { groups } from "../../core/events";
import { computeStats, effectiveness, type HockeyCounts } from "./stats";

type Session = MatchSession<HockeySetup>;

interface Row {
  label: string;
  indent?: 0 | 1 | 2;
  head?: boolean;
  v: (c: HockeyCounts) => number | string;
}

function PeriodTable({ title, rows, periods, byPeriod, total }: { title: string; rows: Row[]; periods: string[]; byPeriod: Record<string, HockeyCounts>; total: HockeyCounts }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="period-table">
          <thead>
            <tr><th></th>{periods.map((p) => <th key={p}>{p}</th>)}<th>Total</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={r.head ? "head" : r.indent ? `i${r.indent}` : ""}>
                <td>{r.label}</td>
                {periods.map((p) => <td key={p}>{r.head ? "" : r.v(byPeriod[p])}</td>)}
                <td>{r.head ? "" : r.v(total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function HockeySummary({ session }: { session: Session }) {
  const { match, update } = session;
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HockeyCounts[]>([]);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    listLocal(user?.uid ?? null, "hockey").then((all) => {
      const prev = all
        .filter((m) => m.id !== match.id && m.status === "completed" && m.setup && (m.setup as HockeySetup).ourTeam === match.setup.ourTeam && m.createdAt < match.createdAt)
        .slice(0, 5)
        .map((m) => computeStats(m.setup as HockeySetup, m.events).total);
      setHistory(prev);
    });
  }, [match, user]);

  const stats = useMemo(() => (match ? computeStats(match.setup, match.events) : null), [match]);
  if (!match || !stats) return null;
  const s = match.setup, t = stats.total, eff = effectiveness(t);
  const ins = hockeyInsights(stats, history);
  const periods = stats.periods;

  const exportCsv = () => {
    const rows: (string | number | null)[][] = [["#", "Period", "Clock", "Event", "Type", "Side", "Detail"]];
    groups(match.events).forEach((g, i) => {
      g.forEach((e) => {
        const d = e.data as Record<string, unknown>;
        rows.push([i + 1, e.clock?.period ?? "", e.clock ? formatClock(e.clock.second) : "", describeTap(g, s.ourTeam, s.opponent), e.type, String(d.side ?? ""),
          Object.entries(d).filter(([k]) => k !== "side").map(([k, v]) => `${k}=${v}`).join("; ")]);
      });
    });
    downloadCsv(rows, safeName("MatchIQ", s.ourTeam, "v", s.opponent, match.createdAt.slice(0, 10)));
  };
  const pdf = async () => {
    if (!ref.current) return;
    setBusy(true);
    try { await exportPdf(ref.current, safeName("MatchIQ", s.ourTeam, "v", s.opponent, match.createdAt.slice(0, 10))); } finally { setBusy(false); }
  };

  const P = (a: number, n: number) => `${pct(a, n)}%`;

  return (
    <>
      <Topbar />
      <div className="row">
        {match.status === "active" && <button className="btn primary small" onClick={() => navigate(`/match/${match.id}`)}>← Back to live capture</button>}
        <button className="link" onClick={() => navigate("/history/hockey")}>Hockey history</button>
      </div>
      <div ref={ref} className="stack">
        <section className="card">
          <p className="muted small center">{[s.competition, s.venue, new Date(match.createdAt).toLocaleDateString()].filter(Boolean).join(" · ")}</p>
          <div className="summary-head" style={{ marginTop: 8 }}>
            <div className="team">{s.ourTeam}</div>
            <div className="final">{t.goals.for.total} - {t.goals.against.total}</div>
            <div className="team">{s.opponent}</div>
          </div>
          {match.status === "active" && <p className="muted small center" style={{ marginTop: 6 }}>Match in progress</p>}
          {match.importedFrom && <p className="muted small center" style={{ marginTop: 6 }}>Imported from the previous MatchIQ app</p>}
        </section>

        <section className="card stack">
          <h3 style={{ margin: 0 }}>Coach's insights</h3>
          <InsightList title="Strengths" items={ins.strengths} empty="No clear strength yet. Capture more of the match." />
          <InsightList title="Work-ons" items={ins.workons} empty="No clear work-on yet." />
          <InsightList title="Game plan" items={ins.plan} />
          {history.length >= 3 && <p className="muted small">Compared with {s.ourTeam}'s last {history.length} matches on this phone.</p>}
        </section>

        <section className="card">
          <h3>Attack journey</h3>
          <div className="funnel">
            <div className="funnel-step"><div className="funnel-value">{t.entries.for.total}</div><div className="funnel-label">Circle entries</div></div>
            <div className="funnel-step"><div className="funnel-value">{t.possWithShot.for}</div><div className="funnel-label">Led to a shot</div><div className="funnel-rate">{eff.entryToShot}%</div></div>
            <div className="funnel-step"><div className="funnel-value">{t.shots.for.on}</div><div className="funnel-label">Shots on target</div><div className="funnel-rate">{eff.shotAccuracy}% accuracy</div></div>
            <div className="funnel-step"><div className="funnel-value">{t.goals.for.total}</div><div className="funnel-label">Goals</div><div className="funnel-rate">{eff.entryToGoal}% of entries</div></div>
          </div>
        </section>

        <PeriodTable title="Attack analysis" periods={periods} byPeriod={stats.byPeriod} total={t} rows={[
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
        ]} />

        <PeriodTable title="Attacking effectiveness" periods={periods} byPeriod={stats.byPeriod} total={t} rows={[
          { label: "Entry → shot %", v: (c) => P(c.possWithShot.for, c.entries.for.total) },
          { label: "Entry → goal %", v: (c) => P(c.possWithGoal.for, c.entries.for.total) },
          { label: "Shot accuracy %", v: (c) => P(c.shots.for.on, c.shots.for.total) },
          { label: "Field goal conversion %", v: (c) => P(c.goals.for.field, c.shots.for.on) },
          { label: "PC conversion %", v: (c) => P(c.goals.for.pc, c.pcs.for) }
        ]} />

        <PeriodTable title="Defence analysis" periods={periods} byPeriod={stats.byPeriod} total={t} rows={[
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
        ]} />

        <PeriodTable title="Discipline" periods={periods} byPeriod={stats.byPeriod} total={t} rows={[
          { label: "Green cards", v: (c) => c.cards.green },
          { label: "Yellow cards", v: (c) => c.cards.yellow },
          { label: "Red cards", v: (c) => c.cards.red }
        ]} />

        <section className="card">
          <h3>Match information</h3>
          <div className="kpis">
            <div className="kpi"><div className="v">{groups(match.events).length}</div><div className="l">Taps recorded</div></div>
            <div className="kpi"><div className="v">{periods.length}</div><div className="l">{periods.length === 2 ? "Halves" : "Quarters"} of {s.periodMinutes} min</div></div>
          </div>
        </section>
      </div>

      <section className="card stack">
        <h3 style={{ margin: 0 }}>Notes</h3>
        <textarea id="h-notes" placeholder="Anything the numbers don't show: injuries, weather, umpiring, who played where."
          value={notes ?? match.notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
        {notes !== null && notes !== (match.notes ?? "") && (
          <button className="btn success" onClick={() => { update((m: Match<HockeySetup>) => ({ ...m, notes: notes ?? "" })); setNotes(null); }}>Save notes</button>
        )}
      </section>

      <div className="row">
        <button className="btn primary" onClick={exportCsv}>Export CSV</button>
        <button className="btn primary" disabled={busy} onClick={pdf}>{busy ? "Making PDF…" : "Export PDF"}</button>
        <button className="btn" onClick={() => navigate("/sport/hockey")}>Hockey home</button>
      </div>
    </>
  );
}
