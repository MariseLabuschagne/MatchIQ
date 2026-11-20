import { useEffect, useMemo, useState } from "react";
import { elapsedSeconds, formatClock, pauseClock, resetClock, startClock } from "../../core/clock";
import { groups, type NewEvent } from "../../core/events";
import { navigate } from "../../core/router";
import { Confirm, Topbar, useWakeLock } from "../../core/ui/components";
import type { Match } from "../../core/types";
import type { MatchSession } from "../../core/useMatch";
import * as A from "./actions";
import { describeTap } from "./describe";
import { PERIOD_NAMES, periodsFor, type EntryLocation, type HockeySetup, type Side, type Zone } from "./model";
import { deriveLive, type HockeyLive } from "./reducer";

type Session = MatchSession<HockeySetup>;

interface Btn {
  id: string;
  ico: string;
  label: string;
  cls: "attack" | "defence" | "discipline" | "control";
  run: (live: HockeyLive, m: Match<HockeySetup>) => NewEvent[];
}

const hadShotOn = (m: Match<HockeySetup>, pos: number) => m.events.some((e) => e.type === "shot" && e.data.side === "for" && e.data.pos === pos && e.data.result === "on");

function possessionButtons(live: HockeyLive): Btn[] {
  const o = live.open!;
  if (o.strokePending) {
    const cls = o.side === "for" ? "attack" : "defence";
    return [
      { id: "ps-scored", ico: "🥅", label: "Stroke scored", cls, run: (l) => A.strokeResult(l, true) },
      { id: "ps-missed", ico: "❌", label: "Stroke missed", cls, run: (l) => A.strokeResult(l, false) }
    ];
  }
  if (o.side === "for" && o.pcPending) {
    return [
      { id: "pc-goal", ico: "🥅", label: "Goal", cls: "attack", run: (l) => A.pcResult(l, "goal") },
      { id: "pc-saved", ico: "🧤", label: "Saved", cls: "attack", run: (l) => A.pcResult(l, "saved") },
      { id: "pc-missed", ico: "❌", label: "Missed", cls: "attack", run: (l) => A.pcResult(l, "missed") },
      { id: "pc-broken", ico: "⚠️", label: "Broken down", cls: "attack", run: (l) => A.pcResult(l, "brokenDown") },
      { id: "pc-on", ico: "🎯", label: "Shot on target", cls: "attack", run: (l) => A.shot(l, "on") },
      { id: "pc-off", ico: "⚪", label: "Shot off target", cls: "attack", run: (l) => A.shot(l, "off") },
      { id: "pc-again", ico: "🚩", label: "PC re-awarded", cls: "attack", run: (l) => A.penaltyCorner(l) },
      { id: "pc-lost", ico: "❌", label: "Turnover lost", cls: "attack", run: (l) => A.turnoverInCircle(l) }
    ];
  }
  if (o.side === "for") {
    return [
      { id: "a-on", ico: "🎯", label: "Shot on target", cls: "attack", run: (l) => A.shot(l, "on") },
      { id: "a-off", ico: "⚪", label: "Shot off target", cls: "attack", run: (l) => A.shot(l, "off") },
      { id: "a-blocked", ico: "🛑", label: "Shot blocked", cls: "attack", run: (l) => A.shot(l, "blocked") },
      { id: "a-pc", ico: "🚩", label: "Penalty corner", cls: "attack", run: (l) => A.penaltyCorner(l) },
      { id: "a-ps", ico: "🏑", label: "Penalty stroke", cls: "attack", run: (l) => A.penaltyStroke(l) },
      { id: "a-lc", ico: "↩️", label: "Long corner", cls: "attack", run: (l) => A.longCornerInPossession(l) },
      { id: "a-goal", ico: "🥅", label: "Goal", cls: "attack", run: (l, m) => A.fieldGoal(l, hadShotOn(m, l.open!.pos)) },
      { id: "a-lost", ico: "❌", label: "Turnover lost", cls: "attack", run: (l) => A.turnoverInCircle(l) }
    ];
  }
  if (o.pcPending) {
    return [
      { id: "dpc-goal", ico: "🥅", label: "Goal", cls: "defence", run: (l) => A.pcResult(l, "goal") },
      { id: "dpc-first", ico: "🛑", label: "First wave save", cls: "defence", run: (l) => A.pcResult(l, "firstWave") },
      { id: "dpc-gk", ico: "🧤", label: "GK save", cls: "defence", run: (l) => A.pcResult(l, "gkSave") },
      { id: "dpc-second", ico: "✅", label: "Second wave save", cls: "defence", run: (l) => A.pcResult(l, "secondWave") },
      { id: "dpc-won", ico: "✅", label: "Turnover won", cls: "defence", run: (l) => A.pcResult(l, "turnoverWon") }
    ];
  }
  return [
    { id: "d-save", ico: "🧤", label: "Goalkeeper save", cls: "defence", run: (l) => A.gkSave(l) },
    { id: "d-goal", ico: "🥅", label: "Goal", cls: "defence", run: (l) => A.goalAgainst(l) },
    { id: "d-pc", ico: "🚩", label: "Penalty corner", cls: "defence", run: (l) => A.penaltyCorner(l) },
    { id: "d-ps", ico: "🏑", label: "Penalty stroke", cls: "defence", run: (l) => A.penaltyStroke(l) },
    { id: "d-off", ico: "⚪", label: "Shot off target", cls: "defence", run: (l) => A.shot(l, "off") },
    { id: "d-won", ico: "✅", label: "Turnover won", cls: "defence", run: (l) => A.turnoverInCircle(l) }
  ];
}

const ZONES: [Zone, string][] = [["att25", "Attacking 25"], ["mid", "Midfield"], ["def25", "Defensive 25"]];

export function HockeyLive({ session }: { session: Session }) {
  const { match, record, undo, redo, remove, update, canUndo, canRedo } = session;
  const [, tick] = useState(0);
  const [choosing, setChoosing] = useState<Side | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [showAll, setShowAll] = useState(false);
  useWakeLock(true);

  const running = match?.clock.runningSince != null;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const live = useMemo(() => (match ? deriveLive(match.setup, match.events) : null), [match]);
  if (!match || !live) return null;
  const s = match.setup;
  const periods = periodsFor(s.format);
  const secs = elapsedSeconds(match.clock);
  const over = match.clock.periodMinutes > 0 && secs >= match.clock.periodMinutes * 60;

  const tap = (id: string, events: NewEvent[]) => {
    if (!events.length) return;
    record(events, { period: live.period, second: secs });
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 350);
  };
  const runBtn = (b: Btn) => tap(b.id, b.run(live, match));

  const nextPeriod = () => {
    const to = periods[live.periodIndex + 1];
    if (!to) return;
    record(A.nextPeriod(live, to), { period: live.period, second: secs });
    update((m) => ({ ...m, clock: resetClock(m.clock) }));
  };
  const endMatch = () => {
    update((m) => ({ ...m, status: "completed", completedAt: new Date().toISOString(), clock: pauseClock(m.clock) }), true);
    navigate(`/match/${match.id}/summary`);
  };

  const mainButtons: { title: string; cls: Btn["cls"]; items: Btn[] }[] = [
    {
      title: "Attack", cls: "attack", items: [
        { id: "entry-for", ico: "⭕", label: "Circle entry", cls: "attack", run: () => { setChoosing("for"); return []; } },
        { id: "lc-for", ico: "🚩", label: "Long corner", cls: "attack", run: (l) => A.longCorner(l, "for") },
        { id: "16-for", ico: "▶", label: "16", cls: "attack", run: (l) => A.restart16(l, "for") },
        ...ZONES.map(([z, label]): Btn => ({ id: `tw-${z}`, ico: "⬆️", label: `Turnover won ${label}`, cls: "attack", run: (l) => A.generalTurnover(l, true, z) }))
      ]
    },
    {
      title: "Defence (against)", cls: "defence", items: [
        { id: "entry-against", ico: "⭕", label: "Circle entry against", cls: "defence", run: () => { setChoosing("against"); return []; } },
        { id: "lc-against", ico: "🚩", label: "Long corner against", cls: "defence", run: (l) => A.longCorner(l, "against") },
        { id: "16-against", ico: "▶", label: "16 against", cls: "defence", run: (l) => A.restart16(l, "against") },
        ...ZONES.map(([z, label]): Btn => ({ id: `tl-${z}`, ico: "⬇️", label: `Turnover lost ${label}`, cls: "defence", run: (l) => A.generalTurnover(l, false, z) }))
      ]
    },
    {
      title: "Discipline", cls: "discipline", items: [
        { id: "green", ico: "🟩", label: "Green card", cls: "discipline", run: (l) => A.card(l, "green") },
        { id: "yellow", ico: "🟨", label: "Yellow card", cls: "discipline", run: (l) => A.card(l, "yellow") },
        { id: "red", ico: "🟥", label: "Red card", cls: "discipline", run: (l) => A.card(l, "red") }
      ]
    }
  ];

  const taps = groups(match.events).reverse();
  const shown = showAll ? taps : taps.slice(0, 6);
  const o = live.open;

  return (
    <>
      <Topbar />
      <section className="scoreboard" aria-label="Score and clock">
        <div className="score-row">
          <div className="score-team">{s.ourTeam}</div>
          <div className="score">{live.score.for} - {live.score.against}</div>
          <div className="score-team">{s.opponent}</div>
        </div>
        <div className={`timer${over ? " over" : ""}`}>{formatClock(secs)}</div>
        <div className="period-label">{PERIOD_NAMES[live.period] ?? live.period}{over ? " · time up" : ""}</div>
        <div className="clock-controls">
          <button className={`btn small ${running ? "" : "success"}`} onClick={() => update((m) => ({ ...m, clock: running ? pauseClock(m.clock) : startClock(m.clock) }))}>
            {running ? "Pause" : secs > 0 ? "Resume" : "Start clock"}
          </button>
          {!live.isLastPeriod ? (
            <button className="btn small" onClick={nextPeriod}>Next: {PERIOD_NAMES[periods[live.periodIndex + 1]]}</button>
          ) : (
            <button className="btn small danger" onClick={() => setConfirmEnd(true)}>End match</button>
          )}
        </div>
      </section>

      {choosing && (
        <section className={`outcome-panel${choosing === "against" ? " against" : ""}`}>
          <h3 className="outcome-title">⭕ {choosing === "for" ? "ENTRY LOCATION" : "ENTRY AGAINST · LOCATION"}</h3>
          <p className="attack-context">Where did the ball enter the circle?</p>
          <div className="event-grid">
            {(["left", "topD", "right"] as EntryLocation[]).map((loc) => (
              <button key={loc} className={`event-button ${choosing === "for" ? "attack" : "defence"}`}
                onClick={() => { tap(`loc-${loc}`, A.startEntry(live, choosing, loc)); setChoosing(null); }}>
                <span className="ico">{loc === "left" ? "⬅️" : loc === "topD" ? "⬆️" : "➡️"}</span>
                {loc === "left" ? "Left" : loc === "topD" ? "Top D" : "Right"}
              </button>
            ))}
          </div>
          <button className="link" style={{ display: "block", margin: "8px auto 0" }} onClick={() => setChoosing(null)}>Cancel</button>
        </section>
      )}

      {!choosing && o && (
        <section className={`outcome-panel${o.side === "against" ? " against" : ""}`} aria-live="polite">
          <h3 className="outcome-title">
            {o.strokePending ? "🏑 PENALTY STROKE" : o.pcPending ? "🚩 PENALTY CORNER" : o.side === "for" ? "🎯 ACTIVE ATTACK" : "🛡️ DEFENDING"}
          </h3>
          <p className="attack-context">
            {o.side === "for" ? "Attack" : "Entry against"} #{o.pos} · {o.loc === "topD" ? "Top D" : o.loc === "left" ? "Left" : "Right"}
            {o.shots ? ` · ${o.shots} shot${o.shots > 1 ? "s" : ""}` : ""}{o.pcs ? ` · ${o.pcs} PC` : ""}
          </p>
          <div className="event-grid">
            {possessionButtons(live).map((b) => (
              <button key={b.id} className={`event-button ${b.cls}${flash === b.id ? " flash" : ""}`} onClick={() => runBtn(b)}>
                <span className="ico">{b.ico}</span>{b.label}
              </button>
            ))}
            <button className="event-button control" onClick={() => tap("end-poss", A.endPossession(live))}>
              <span className="ico">✔</span>{o.side === "for" ? "End attack" : "End defence"}
            </button>
          </div>
        </section>
      )}

      {mainButtons.map((sec) => (
        <section key={sec.title}>
          <h2 className={`event-category ${sec.cls}`}>{sec.title}</h2>
          <div className="event-grid">
            {sec.items.map((b) => (
              <button key={b.id} className={`event-button ${b.cls}${flash === b.id ? " flash" : ""}`} onClick={() => runBtn(b)}>
                <span className="ico">{b.ico}</span>{b.label}
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="toolbar">
        <button className="btn" disabled={!canUndo} onClick={undo}>↩ Undo</button>
        <button className="btn" disabled={!canRedo} onClick={redo}>↪ Redo</button>
        <button className="btn" onClick={() => navigate(`/match/${match.id}/summary`)}>Stats</button>
        <button className="btn danger" onClick={() => setConfirmEnd(true)}>End</button>
      </div>

      <section className="card">
        <div className="spread" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Timeline</h3>
          <span className="muted small">{taps.length} taps</span>
        </div>
        {taps.length === 0 ? (
          <p className="muted small">Nothing captured yet. Start the clock and tap what happens.</p>
        ) : (
          <div className="timeline">
            {shown.map((g) => (
              <div key={g[0].group} className="timeline-row">
                <span className="timeline-time">{g[0].clock ? `${g[0].clock.period} ${formatClock(g[0].clock.second)}` : ""}</span>
                <span className="timeline-event">{describeTap(g, s.ourTeam, s.opponent)}</span>
                <button onClick={() => remove(g[0].id)} aria-label="Delete this tap">Delete</button>
              </div>
            ))}
            {taps.length > 6 && <button className="link" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show fewer" : `Show all ${taps.length}`}</button>}
          </div>
        )}
      </section>

      {confirmEnd && (
        <Confirm title="End the match?" body="The match moves to history and the summary opens. You can still open it later." confirmLabel="End match" danger onConfirm={endMatch} onClose={() => setConfirmEnd(false)} />
      )}
    </>
  );
}
