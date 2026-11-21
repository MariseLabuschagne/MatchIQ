import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../core/auth/AuthProvider";
import { formatClock } from "../../core/clock";
import { downloadCsv, safeName } from "../../core/export";
import { exportReportPdf } from "../../core/report";
import { hockeyReport } from "./report";
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
import { HOCKEY_TABLES, type Row } from "./tables";

type Session = MatchSession<HockeySetup>;

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
    setBusy(true);
    try { await exportReportPdf(hockeyReport(match, stats, ins, history.length), safeName("MatchIQ", s.ourTeam, "v", s.opponent, match.createdAt.slice(0, 10))); } finally { setBusy(false); }
  };

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

        {HOCKEY_TABLES.map((tb) => <PeriodTable key={tb.title} title={tb.title} periods={periods} byPeriod={stats.byPeriod} total={t} rows={tb.rows} />)}

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
