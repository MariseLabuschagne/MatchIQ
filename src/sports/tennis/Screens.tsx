import { useMemo, useState } from "react";
import { navigate } from "../../core/router";
import { Confirm, InsightList, Sheet, Topbar, useWakeLock } from "../../core/ui/components";
import { frac, pct } from "../../core/insights";
import type { MatchSession } from "../../core/useMatch";
import {
  DIRS, LEVELS, POSITIONS, RALLY, SHOTS, SHOT_LABEL, isGamesFormat, isLongRally, mergePoints, other,
  FORMATS, type Ending, type Level, type P, type ShotKey, type TennisPoint, type TennisSetup
} from "./model";
import { bpFor, ptLabels, replay, resultString, type TennisState } from "./scoring";
import { computeTennisStats, tennisInsights } from "./stats";
import { serveReturnRows, statCells, tennisReport, type StatRow } from "./report";
import { exportReportPdf } from "../../core/report";
import { safeName } from "../../core/export";
import { venueLabel } from "./words";

type Session = MatchSession<TennisSetup>;

/** The capture check (taps and seconds per point) is hidden for now; flip to show it on the report again. */
const SHOW_CAPTURE_CHECK = false;
type Step = "serve1" | "serve2" | "who" | "how" | "shot" | "extras";

interface Draft {
  step: Step;
  serve: "first" | "second" | null;
  committed: boolean;
  taps: number;
  t0: number | null;
  crumbs: string[];
}

/** A point is its "point" event plus any later "detail" events; undo and remove take them all out together. */
function removePoint(session: Session, pointId: string) {
  session.update((x) => ({ ...x, events: x.events.filter((e) => e.id !== pointId && (e.data as { point?: string }).point !== pointId) }));
}

const newDraft = (level: Level): Draft => ({ step: level === "quick" ? "who" : "serve1", serve: null, committed: false, taps: 0, t0: null, crumbs: [] });

function useTennis(session: Session) {
  const m = session.match!;
  const points = useMemo(() => mergePoints(m.events), [m.events]);
  const r = useMemo(() => replay(m.setup, points), [m.setup, points]);
  const name = (s: P) => (s === "p" ? m.setup.player : m.setup.opponent);
  return { m, points, r, name };
}

function Tabs({ id, view }: { id: string; view: "live" | "points" | "report" }) {
  return (
    <nav className="tabs" aria-label="Match views">
      {(["live", "points", "report"] as const).map((v) => (
        <button key={v} aria-current={view === v ? "page" : undefined} onClick={() => navigate(v === "live" ? `/match/${id}` : `/match/${id}/${v}`)}>
          {v === "live" ? "Live" : v === "points" ? "Points" : "Report"}
        </button>
      ))}
    </nav>
  );
}

function Board({ r, setup, name }: { r: TennisState; setup: TennisSetup; name: (s: P) => string }) {
  const lab = ptLabels(r, setup.noAd), bp = bpFor(r, setup.noAd);
  const row = (side: P) => (
    <div className="tboard-row">
      <span className={`srv${r.server === side && !r.done ? "" : " off"}`} aria-label={r.server === side ? "serving" : undefined} />
      <span className="tname"><i style={{ background: side === "p" ? "var(--attack)" : "var(--defence)" }} />{name(side)}</span>
      <span className="tsets">
        {r.sets.map((x, i) => (
          <span key={i} className={x.w === side ? "won" : ""}>
            {x.mtb && x.tb ? x.tb[side] : x[side]}
            {x.tb && !x.mtb && x.w !== side ? <sup>{x.tb[side]}</sup> : null}
          </span>
        ))}
        {!r.done && !r.mtb && <span className="cur">{r.games[side]}</span>}
      </span>
      <span className="tpts">{r.done ? (r.winner === side ? "✓" : "") : lab[side]}</span>
    </div>
  );
  return (
    <section className="tboard" aria-label="Score">
      {row("p")}
      {row("o")}
      <div className="tnote">
        <span>{r.done ? "Match over" : isGamesFormat(setup.format) ? (lab.note || `Game ${r.games.p + r.games.o + 1} of ${FORMATS[setup.format].totalGames}`) : `Set ${r.sets.length + 1}${lab.note ? " · " + lab.note : ""}`}</span>
        <span>{r.done ? "" : bp ? <span className="flag">Break point {name(bp)}</span> : `${name(r.server)} serving`}</span>
      </div>
    </section>
  );
}

const TBtn = ({ label, sub, cls = "", onClick }: { label: string; sub?: string; cls?: string; onClick: () => void }) => (
  <button className={`tbtn ${cls}`} onClick={onClick}>{label}{sub && <span className="sub">{sub}</span>}</button>
);

export function TennisLive({ session }: { session: Session }) {
  const { m, points, r, name } = useTennis(session);
  const level = m.setup.level;
  const [draft, setDraft] = useState<Draft>(() => newDraft(level));
  const [sheet, setSheet] = useState<null | "missed" | "level" | "end" | "new">(null);
  useWakeLock(m.status === "active");

  const last = points[points.length - 1];
  const srv = r.server;

  /** Each tap: count it, time the point, apply. */
  const step = (fn: (d: Draft, timing: { taps: number; ms: number }) => Partial<Draft> | "finish") => {
    const t0 = draft.t0 ?? Date.now();
    const taps = draft.taps + 1;
    const res = fn(draft, { taps, ms: Date.now() - t0 });
    if (res === "finish") setDraft(newDraft(level));
    else setDraft({ ...draft, ...res, taps, t0 });
  };
  const commitPoint = (data: Partial<TennisPoint>) => session.record([{ type: "point", data: { level, ...data } }]);
  const detail = (data: Partial<TennisPoint>, timing: { taps: number; ms: number }) =>
    last && session.record([{ type: "detail", data: { point: last.id, ...data, ...timing } }]);

  const afterEnding = (ending: Ending): Partial<Draft> | "finish" => {
    if (ending === "doubleFault") return "finish";
    if (ending === "ace") return level === "detailed" ? { step: "extras" } : "finish";
    return level === "quick" ? "finish" : { step: "shot" };
  };

  const undo = () => {
    if (!draft.committed && draft.crumbs.length) return setDraft(newDraft(level));
    if (last) removePoint(session, last.id);
    setDraft(newDraft(level));
  };

  let body: React.ReactNode = null, title = "", tag = "", hint = "", skip = false;

  if (r.done && !draft.committed) {
    return (
      <>
        <Topbar right={<Tabs id={m.id} view="live" />} />
        <Board r={r} setup={m.setup} name={name} />
        <section className="card stack">
          <h2>{name(r.winner!)} won {resultString(r)}</h2>
          <p className="muted">Every point is saved. Open the report to see strengths and work-ons.</p>
          <button className="btn primary block" onClick={() => { session.update((x) => ({ ...x, status: "completed", completedAt: x.completedAt ?? new Date().toISOString() }), true); navigate(`/match/${m.id}/report`); }}>Open report</button>
          <button className="btn block" onClick={undo}>Undo last point</button>
        </section>
      </>
    );
  }
  if (m.setup.endReason) {
    return (
      <>
        <Topbar right={<Tabs id={m.id} view="live" />} />
        <Board r={r} setup={m.setup} name={name} />
        <section className="card stack">
          <h2>Match ended: {m.setup.endReason}</h2>
          <button className="btn primary block" onClick={() => navigate(`/match/${m.id}/report`)}>Open report</button>
          <button className="btn block" onClick={() => session.update((x) => ({ ...x, status: "active", completedAt: null, setup: { ...x.setup, endReason: null } }))}>Carry on capturing</button>
        </section>
      </>
    );
  }

  const P_ = name("p"), O_ = name("o");
  if (draft.step === "serve1") {
    title = `${name(srv)} serving`; tag = "Serve";
    body = <div className="tgrid">
      <TBtn cls="tall" label="1st serve in" onClick={() => step(() => ({ serve: "first", step: "who", crumbs: [...draft.crumbs, "1st serve in"] }))} />
      <TBtn cls="tall" label="Fault" sub="1st serve missed" onClick={() => step(() => ({ step: "serve2", crumbs: [...draft.crumbs, "Fault"] }))} />
    </div>;
  } else if (draft.step === "serve2") {
    title = `${name(srv)} · second serve`; tag = "Serve";
    body = <div className="tgrid">
      <TBtn cls="tall" label="2nd serve in" onClick={() => step(() => ({ serve: "second", step: "who", crumbs: [...draft.crumbs, "2nd serve in"] }))} />
      <TBtn cls="tall" label="Double fault" sub={`point to ${name(other(srv))}`} onClick={() => step((_d, t) => {
        commitPoint({ winner: other(srv), serve: "second", ending: "doubleFault", finalShotBy: srv, ...t });
        return "finish";
      })} />
    </div>;
  } else if (draft.step === "who") {
    title = "Who won the point?"; tag = "Required";
    const who = (w: P) => step((d, t) => { commitPoint({ winner: w, serve: d.serve, ending: null, finalShotBy: null, ...t }); return { committed: true, step: "how", crumbs: [...d.crumbs, `${name(w)} won`] }; });
    body = <div className="tgrid">
      <TBtn cls="tall p" label={P_} onClick={() => who("p")} />
      <TBtn cls="tall o" label={O_} onClick={() => who("o")} />
    </div>;
    if (level === "quick") hint = "Quick level: one tap is enough. Add how it ended if you can.";
  } else if (draft.step === "how" && last) {
    title = "How did it end?"; tag = "Optional"; skip = true;
    const served = level === "quick" || !!draft.serve;
    const opts: [Ending, P, string, string, P][] = [];
    if (last.winner === "p") {
      if (srv === "p" && served) opts.push(["ace", "p", "Ace", `by ${P_}`, "p"]);
      if (srv === "o" && level === "quick") opts.push(["doubleFault", "o", "Double fault", `by ${O_}`, "o"]);
      opts.push(["winner", "p", "Winner", `by ${P_}`, "p"]);
      opts.push(["error", "o", "Opponent error", `${O_} missed`, "o"]);
    } else {
      if (srv === "o" && served) opts.push(["ace", "o", "Ace", `by ${O_}`, "o"]);
      if (srv === "p" && level === "quick") opts.push(["doubleFault", "p", "Double fault", `by ${P_}`, "p"]);
      opts.push(["winner", "o", "Opponent winner", `by ${O_}`, "o"]);
      if (level === "quick") opts.push(["error", "p", "Error", `${P_} missed`, "p"]);
      else {
        opts.push(["forcedError", "p", "Forced error", `${P_} under pressure`, "p"]);
        opts.push(["unforcedError", "p", "Unforced error", `${P_} had time`, "p"]);
      }
    }
    body = <div className="tgrid">
      {opts.map(([ending, by, label, sub, cls]) => (
        <TBtn key={ending + by} cls={cls} label={label} sub={sub} onClick={() => step((d, t) => {
          detail({ ending, finalShotBy: by }, t);
          const next = afterEnding(ending);
          return next === "finish" ? "finish" : { ...next, crumbs: [...d.crumbs, label] };
        })} />
      ))}
    </div>;
    if (points.length < 6 && level !== "quick") hint = "Winner: the ball was not touched. Forced error: the shot was hard to reach. Unforced error: time and position, and still missed. Unsure? Pick forced.";
  } else if (draft.step === "shot" && last) {
    const by = last.finalShotBy ?? last.winner;
    title = `Final shot by ${name(by)}`; tag = "Optional"; skip = true;
    const rallyChips = last.ending !== "ace" && last.ending !== "doubleFault" && (
      <div>
        <h4 className="small muted" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Rally length (optional)</h4>
        <div className="chiprow">
          {RALLY.map(([v, l]) => (
            <button key={v} aria-pressed={last.rally === v} onClick={() => detail({ rally: last.rally === v ? null : v }, { taps: draft.taps, ms: Date.now() - (draft.t0 ?? Date.now()) })}>{l}</button>
          ))}
        </div>
      </div>
    );
    body = <div className="stack">{rallyChips}<div className="tgrid">
      {SHOTS.map(([k, label]) => (
        <TBtn key={k} cls={by} label={label} onClick={() => step((d, t) => {
          detail({ shot: k as ShotKey }, t);
          return level === "detailed" ? { step: "extras", crumbs: [...d.crumbs, label] } : "finish";
        })} />
      ))}
    </div></div>;
  } else if (draft.step === "extras" && last) {
    title = "Extra detail"; tag = "Detailed";
    const ctx = r.ctx[points.length - 1];
    const chip = (label: string, key: "serveDir" | "rally" | "position", list: [string, string][]) => (
      <div>
        <h4 className="small muted" style={{ marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</h4>
        <div className="chiprow">
          {list.map(([v, l]) => (
            <button key={v} aria-pressed={last[key] === v} onClick={() => step((_d, t) => { detail({ [key]: last[key] === v ? null : v }, t); return {}; })}>{l}</button>
          ))}
        </div>
      </div>
    );
    body = <div className="stack">
      {last.serve && last.ending !== "doubleFault" && ctx?.server === "p" && chip("Serve direction", "serveDir", DIRS)}
      {last.ending !== "ace" && last.ending !== "doubleFault" && chip(`${P_}'s position`, "position", POSITIONS)}
      <TBtn cls="wide p" label="Done · next point" onClick={() => step(() => "finish")} />
    </div>;
  }

  return (
    <>
      <Topbar right={<Tabs id={m.id} view="live" />} />
      <Board r={r} setup={m.setup} name={name} />
      <section className="stack" style={{ gap: 10 }}>
        <div className="step-head"><span className="step-title">{title}</span><span className="step-tag">{tag}</span></div>
        {draft.crumbs.length > 0 && <div className="crumbs">{draft.crumbs.map((c, i) => <span key={i} className="crumb">{c}</span>)}</div>}
        {body}
        {hint && <p className="hint">{hint}</p>}
        {skip && <button className="link center" onClick={() => step(() => "finish")}>Skip · next point</button>}
      </section>
      <div className="toolbar">
        <button className="btn" disabled={!points.length && !draft.crumbs.length} onClick={undo}>↩ Undo</button>
        <button className="btn" onClick={() => setSheet("missed")}>Missed point</button>
        <button className="btn" onClick={() => setSheet("level")}>{LEVELS[level].label}</button>
        <button className="btn danger" onClick={() => setSheet("end")}>End</button>
      </div>

      {sheet === "missed" && (
        <MissedSheet setup={m.setup} points={points} name={name} onClose={() => setSheet(null)}
          onAdd={(winners) => {
            session.record(winners.map((w) => ({ type: "point", data: { level, winner: w, serve: null, ending: "unknown", finalShotBy: null, missed: true } })));
            setDraft(newDraft(level));
          }} />
      )}
      {sheet === "level" && (
        <Sheet onClose={() => setSheet(null)}>
          <h2>Capture level</h2>
          <p className="muted small">Changes from the next point. Drop down any time it gets too much.</p>
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <TBtn key={l} cls={`wide${l === level ? " p" : ""}`} label={LEVELS[l].label} sub={LEVELS[l].hint} onClick={() => {
              session.update((x) => ({ ...x, setup: { ...x.setup, level: l } }));
              if (!draft.taps) setDraft(newDraft(l));
              setSheet(null);
            }} />
          ))}
        </Sheet>
      )}
      {sheet === "end" && (
        <Sheet onClose={() => setSheet(null)}>
          <h2>End the match early?</h2>
          <p className="muted small">The report works on a partial match.</p>
          <div className="tgrid">
            {["Retired", "Weather", "Time limit", "Other"].map((reason) => (
              <TBtn key={reason} label={reason} onClick={() => {
                session.update((x) => ({ ...x, status: "completed", completedAt: new Date().toISOString(), setup: { ...x.setup, endReason: reason } }), true);
                setSheet(null); navigate(`/match/${m.id}/report`);
              }} />
            ))}
          </div>
        </Sheet>
      )}
    </>
  );
}

/** Points to add so that `w` wins the game in progress (or the tiebreak). */
function pointsToWinGame(setup: TennisSetup, points: TennisPoint[], w: P): P[] {
  const start = replay(setup, points);
  const key = (x: TennisState) => `${x.sets.length}:${x.games.p}:${x.games.o}`;
  const add: P[] = [];
  let cur = start;
  while (!cur.done && key(cur) === key(start) && add.length < 30) {
    add.push(w);
    cur = replay(setup, [...points, ...add.map((x, i) => ({ id: `fix${i}`, winner: x, serve: null, ending: "unknown" as Ending, finalShotBy: null, missed: true }))]);
  }
  return add;
}

/** Missed points: add one or more, or a whole game, for whoever won them, so the score is right again. */
function MissedSheet({ setup, points, name, onClose, onAdd }: {
  setup: TennisSetup; points: TennisPoint[]; name: (s: P) => string; onClose: () => void; onAdd: (winners: P[]) => void;
}) {
  const [added, setAdded] = useState(0);
  const r = replay(setup, points);
  const lab = ptLabels(r, setup.noAd);
  const add = (winners: P[]) => { if (winners.length) { onAdd(winners); setAdded((n) => n + winners.length); } };
  return (
    <Sheet onClose={onClose}>
      <h2>Missed a point?</h2>
      <p className="muted small">Tap who won each point you missed, as many times as needed, until the score matches the court. Missed points count in the score and points won, but not in how points ended.</p>
      <p className="center" style={{ fontWeight: 700, fontSize: 18 }}>
        {r.done ? "Match over" : `${name("p")} ${r.games.p}–${r.games.o} ${name("o")} · ${lab.p}–${lab.o}`}
      </p>
      <div className="tgrid">
        {(["p", "o"] as P[]).map((w) => (
          <TBtn key={w} cls={w} label={`+1 point`} sub={name(w)} onClick={() => !r.done && add([w])} />
        ))}
        {(["p", "o"] as P[]).map((w) => (
          <TBtn key={`g${w}`} label="+1 game" sub={name(w)} onClick={() => !r.done && add(pointsToWinGame(setup, points, w))} />
        ))}
      </div>
      {added > 0 && <p className="muted small center">{added} missed {added === 1 ? "point" : "points"} added. Undo takes them off one at a time.</p>}
      <button className="btn primary block" onClick={onClose}>Done</button>
    </Sheet>
  );
}

function describePoint(pt: TennisPoint, name: (s: P) => string): string {
  if (pt.missed) return `Missed point · ${name(pt.winner)} won`;
  const bits: string[] = [];
  if (pt.serve) bits.push(pt.serve === "first" ? "1st serve" : "2nd serve");
  const e: Record<string, string> = { ace: "Ace", doubleFault: "Double fault", winner: "Winner", forcedError: "Forced error", unforcedError: "Unforced error", error: "Error" };
  if (pt.ending && e[pt.ending]) bits.push(e[pt.ending] + (pt.finalShotBy && pt.ending !== "ace" && pt.ending !== "doubleFault" ? ` by ${name(pt.finalShotBy)}` : ""));
  if (pt.shot) bits.push(SHOT_LABEL[pt.shot]);
  if (pt.rally) bits.push(isLongRally(pt.rally) ? "10+ shots" : pt.rally === "short" ? "under 10 shots" : `${pt.rally} shots`);
  if (pt.position === "net") bits.push("at net");
  return `${name(pt.winner)} won${bits.length ? " · " + bits.join(" · ") : ""}`;
}

export function TennisPoints({ session }: { session: Session }) {
  const { m, points, r, name } = useTennis(session);
  const [confirm, setConfirm] = useState<string | null>(null);
  const games = isGamesFormat(m.setup.format);
  return (
    <>
      <Topbar right={<Tabs id={m.id} view="points" />} />
      <h2>Points ({points.length})</h2>
      <p className="muted small">Newest first. Remove a point and the score is worked out again.</p>
      <div className="plist">
        {points.length === 0 && <p className="muted center">No points yet.</p>}
        {points.map((pt, i) => ({ pt, i })).reverse().map(({ pt, i }) => {
          const c = r.ctx[i];
          return (
            <div key={pt.id} className="prow">
              <span className="bar" style={{ background: pt.winner === "p" ? "var(--attack)" : "var(--defence)" }} />
              <div style={{ minWidth: 0 }}>
                <div className="meta">#{i + 1}{c ? ` · ${games ? "" : `Set ${c.set} · `}${c.games} · ${c.pts} · ${name(c.server)} serving` : ""}</div>
                <div className="desc">{describePoint(pt, name)}</div>
              </div>
              <button className="btn small" onClick={() => setConfirm(pt.id)}>Remove</button>
            </div>
          );
        })}
      </div>
      {confirm && <Confirm title="Remove this point?" body="The score is worked out again without it." confirmLabel="Remove point" danger onConfirm={() => removePoint(session, confirm)} onClose={() => setConfirm(null)} />}
    </>
  );
}

/** Stats in two columns: the count ("3 of 5") and the percentage. Under 10, the % is greyed: too few to be a trend. */
function StatTable({ rows }: { rows: StatRow[] }) {
  return (
    <div className="table-wrap"><table className="period-table stat-table">
      <thead><tr><th></th><th>Count</th><th>%</th></tr></thead>
      <tbody>{rows.map(statCells).map((r) => (
        <tr key={r.cells[0]}>
          <td>{r.cells[0]}</td>
          <td>{r.cells[1]}</td>
          <td className={r.dim?.includes(2) ? "dim" : ""}>{r.cells[2]}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export function TennisReport({ session }: { session: Session }) {
  const { m, points, r, name } = useTennis(session);
  const st = useMemo(() => computeTennisStats(points, r), [points, r]);
  const ins = tennisInsights(st, name("p"), name("o"));
  const isSample = m.setup.competition.includes("(generated)");
  const avgT = st.taps.length ? (st.taps.reduce((a, b) => a + b, 0) / st.taps.length).toFixed(1) : "–";
  const avgS = st.ms.length ? `${(st.ms.reduce((a, b) => a + b, 0) / st.ms.length / 1000).toFixed(1)} s` : "–";
  const rows = (list: [string, string | number][]) => list.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>);
  const shotKeys = SHOTS.map(([k]) => k).filter((k) => st.shots[k] || st.oShots[k]);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    try { await exportReportPdf(tennisReport(m, r, st, ins), safeName("MatchIQ", m.setup.player, "v", m.setup.opponent, m.createdAt.slice(0, 10))); } finally { setBusy(false); }
  };

  return (
    <>
      <Topbar right={<Tabs id={m.id} view="report" />} />
      {isSample && <p className="message">Sample data, generated to show the report. Not a real match.</p>}
      <section className="card">
        <p className="muted small">{[`${name("p")} vs ${name("o")}`, venueLabel(m.setup), m.setup.competition].filter(Boolean).join(" · ")}</p>
        <div className="final" style={{ fontSize: 34, fontWeight: 900, margin: "6px 0" }}>{resultString(r) || `${r.games.p}–${r.games.o}`}</div>
        <p className="muted">{r.done ? `${name(r.winner!)} won` : m.setup.endReason ? `Ended early · ${m.setup.endReason}` : "In progress"} · {st.n} points captured</p>
      </section>
      {st.n < 10 && <p className="hint">Capture at least 10 points to see patterns. Percentages in grey come from fewer than 10 points.</p>}
      <section className="card stack">
        <InsightList title="Strengths" items={ins.strengths} empty="No clear strength yet. Keep capturing." />
        <InsightList title="Work-ons" items={ins.workons} empty="No clear work-on yet." />
        <InsightList title="Game plan for next time" items={ins.plan} />
      </section>
      <section className="card">
        <h3>Key numbers</h3>
        <div className="kpis">
          <div className="kpi"><div className="v">{pct(st.won, st.n)}%</div><div className="l">Points won ({st.won} of {st.n})</div></div>
          <div className="kpi"><div className="v">{st.holds.won}/{st.holds.n}</div><div className="l">Service games held</div></div>
          <div className="kpi"><div className="v">{st.breaks.won}/{st.breaks.n}</div><div className="l">Return games broken</div></div>
          <div className="kpi"><div className="v">{st.winners} / {st.errorsAll}</div><div className="l">Winners / errors</div></div>
        </div>
      </section>
      <section className="card">
        <h3>Serve, return and pressure</h3>
        <StatTable rows={serveReturnRows(st)} />
      </section>
      <section className="card">
        <h3>How points ended</h3>
        <div className="table-wrap"><table className="period-table">
          <thead><tr><th></th><th>{name("p")}</th><th>{name("o")}</th></tr></thead>
          <tbody>
            <tr><td>Winners</td><td>{st.winners}</td><td>{st.oWinners}</td></tr>
            <tr><td>Aces</td><td>{st.aces}</td><td>{st.oAces}</td></tr>
            <tr><td>Errors</td><td>{st.errorsAll}{st.ue ? ` (${st.ue} unforced)` : ""}</td><td>{st.oErr}</td></tr>
            <tr><td>Double faults</td><td>{st.dfs}</td><td>{st.oDfs}</td></tr>
          </tbody>
        </table></div>
      </section>
      {shotKeys.length > 0 && (
        <section className="card">
          <h3>Final shot</h3>
          <p className="muted small" style={{ margin: "4px 0 8px" }}>Winners and errors by {name("p")}, and errors {name("o")} made, by the shot that ended the point.</p>
          <div className="table-wrap"><table className="period-table final-shot">
            <thead><tr><th>Shot</th><th>Winners</th><th>Errors</th><th>Opp. errors</th></tr></thead>
            <tbody>{shotKeys.map((k) => <tr key={k}><td>{SHOT_LABEL[k]}</td><td>{st.shots[k]?.w ?? 0}</td><td>{st.shots[k]?.e ?? 0}</td><td>{st.oShots[k]?.e ?? 0}</td></tr>)}</tbody>
          </table></div>
        </section>
      )}
      {st.sets.length > 1 && !isGamesFormat(m.setup.format) && (
        <section className="card">
          <h3>By set</h3>
          <div className="table-wrap"><table className="period-table">
            <thead><tr><th>Set</th><th>Points won</th><th>%</th><th>Winners</th><th>Errors</th></tr></thead>
            <tbody>{st.sets.map((x, i) => <tr key={i}><td>{i + 1}</td><td>{x.won} of {x.n}</td><td className={x.n < 10 ? "dim" : ""}>{pct(x.won, x.n)}%</td><td>{x.winners}</td><td>{x.errors}</td></tr>)}</tbody>
          </table></div>
        </section>
      )}
      {SHOW_CAPTURE_CHECK && (
      <section className="card">
        <h3>Capture check</h3>
        <div className="table-wrap"><table className="period-table"><tbody>{rows([
          ["Points with detail", frac(st.detailCount, st.n)], ["Missed points", st.missed],
          ["Average taps per point", avgT], ["Average time to capture a point", avgS]
        ])}</tbody></table></div>
        <p className="muted small" style={{ marginTop: 8 }}>If capturing takes more than about 8 seconds a point, try a simpler level.</p>
      </section>
      )}
      <div className="row">
        <button className="btn primary" disabled={busy} onClick={pdf}>{busy ? "Making PDF…" : "Export PDF"}</button>
        <button className="btn" onClick={() => navigate("/sport/tennis")}>Tennis home</button>
      </div>
    </>
  );
}



/** Live capture, the points list or the report, picked by the route. */
export function TennisMatchView({ session, view }: { session: Session; view?: string }) {
  if (view === "points") return <TennisPoints session={session} />;
  if (view === "report") return <TennisReport session={session} />;
  return <TennisLive session={session} />;
}
