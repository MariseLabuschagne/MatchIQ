import { useEffect, useState } from "react";
import { useAuth } from "../../core/auth/AuthProvider";
import { createMatch, remember } from "../../core/matchFactory";
import { navigate } from "../../core/router";
import { BackLink } from "../../core/ui/components";
import { useMySquads } from "../../core/ui/Squads";
import { firstName } from "../../core/names";
import type { MySquad } from "../../core/squads";
import { appendEvents } from "../../core/events";
import { saveMatch } from "../../core/storage/sync";
import type { Match } from "../../core/types";
import { FORMATS, LEVELS, VENUES, type FormatKey, type Level, type TennisSetup } from "./model";
import { simulateMatch } from "./simulate";

export function TennisSetupScreen() {
  const { user } = useAuth();
  const [f, setF] = useState<TennisSetup>({
    player: remember("tennis.player"), opponent: "", competition: "", venue: undefined,
    format: (remember("tennis.format") as FormatKey) || "bo3mtb", noAd: remember("tennis.noAd") !== "0",
    firstServer: "p", level: (remember("tennis.level") as Level) || "standard", endReason: null
  });
  const [squad, setSquad] = useState<MySquad | null>(null);
  const [players] = useMySquads("tennis");
  const [typing, setTyping] = useState(false);
  const set = <K extends keyof TennisSetup>(k: K, v: TennisSetup[K]) => setF((x) => ({ ...x, [k]: v }));

  const pickSquad = (s: MySquad | null) => {
    setSquad(s);
    setTyping(!s);
    try { localStorage.setItem("matchiq.tennis.squad", s?.id ?? ""); } catch { /* private mode */ }
    set("player", s ? s.name : "");
  };
  // Start on the player used last time, or the only one there is.
  useEffect(() => {
    if (!players || squad || typing) return;
    let last = "";
    try { last = localStorage.getItem("matchiq.tennis.squad") ?? ""; } catch { /* private mode */ }
    const pick = players.find((p) => p.id === last) ?? (players.length === 1 ? players[0] : undefined);
    if (pick) pickSquad(pick);
  }, [players]); // eslint-disable-line react-hooks/exhaustive-deps
  const showInput = typing || !players?.length;
  const pName = firstName(f.player) || "Your player", oName = firstName(f.opponent) || "Opponent";

  const start = async () => {
    const setup: TennisSetup = { ...f, player: f.player.trim() || "Player", opponent: f.opponent.trim() || "Opponent", competition: f.competition.trim() };
    if (!setup.venue) delete setup.venue;
    remember("tennis.player", setup.player);
    remember("tennis.format", setup.format);
    remember("tennis.noAd", setup.noAd ? "1" : "0");
    remember("tennis.level", setup.level);
    const m = await createMatch("tennis", setup, 0, user?.uid ?? null, squad?.id);
    navigate(`/match/${m.id}`);
  };

  const sample = async () => {
    const setup: TennisSetup = { player: "Sample player", opponent: "Sample opponent", competition: "Example match (generated)", format: "bo3mtb", noAd: true, firstServer: "p", level: "detailed", endReason: null };
    let m = (await createMatch("tennis", setup, 0, null)) as Match;
    for (const pt of simulateMatch(setup)) {
      const { id: _id, ...rest } = pt;
      void _id;
      m = appendEvents(m, [{ type: "point", data: rest as Record<string, unknown> }]);
    }
    m = { ...m, status: "completed", completedAt: new Date().toISOString() };
    // Saved on this phone only (no owner), so it never reaches the cloud or the history list.
    await saveMatch(m, null);
    navigate(`/match/${m.id}/report`);
  };

  return (
    <>
      <BackLink to="/capture" label="New match" />
      <div className="card">
        <h2>Capture a match, one point at a time</h2>
        <p className="muted" style={{ margin: "6px 0 16px" }}>After each point, tap who won and, if you can, how. MatchIQ keeps the score.</p>
        <div className="field">Player
          {!!players?.length && (
            <div className="chiprow" role="group" aria-label="Choose the player">
              {players.map((p) => <button key={p.id} type="button" aria-pressed={squad?.id === p.id} onClick={() => pickSquad(p)}>{p.name}</button>)}
              <button type="button" aria-pressed={showInput} onClick={() => pickSquad(null)}>Someone else</button>
            </div>
          )}
          {showInput && <input id="t-player" type="text" value={f.player} onChange={(e) => set("player", e.target.value)} placeholder="e.g. Mia" aria-label="Player's name" />}
          {squad && <span className="small muted">Shared with everyone following {squad.name}.</span>}
          {showInput && !!players?.length && <span className="small muted">Saved on this phone only, not shared.</span>}
        </div>
        <label className="field">Opponent (optional)<input id="t-opp" type="text" value={f.opponent} onChange={(e) => set("opponent", e.target.value)} placeholder="Name or school" /></label>
        <div className="field">Venue
          <div className="seg" role="group" aria-label="Venue">
            {VENUES.map(([v, label]) => <button key={v} type="button" aria-pressed={f.venue === v} onClick={() => set("venue", f.venue === v ? undefined : v)}>{label}</button>)}
          </div>
        </div>
        <label className="field">Format
          <select id="t-format" value={f.format} onChange={(e) => set("format", e.target.value as FormatKey)}>
            {(Object.keys(FORMATS) as FormatKey[]).map((k) => <option key={k} value={k}>{FORMATS[k].label}</option>)}
          </select>
        </label>
        <label className="check">No-ad scoring (deciding point at deuce)<input id="t-noad" type="checkbox" checked={f.noAd} onChange={(e) => set("noAd", e.target.checked)} /></label>
        <div className="field">Serves first
          <div className="seg">
            <button type="button" aria-pressed={f.firstServer === "p"} onClick={() => set("firstServer", "p")}>{pName}</button>
            <button type="button" aria-pressed={f.firstServer === "o"} onClick={() => set("firstServer", "o")}>{oName}</button>
          </div>
        </div>
        <div className="field">Capture level
          <div className="seg">
            {(Object.keys(LEVELS) as Level[]).map((l) => <button key={l} aria-pressed={f.level === l} onClick={() => set("level", l)}>{LEVELS[l].label}</button>)}
          </div>
          <span className="small">{LEVELS[f.level].hint}</span>
        </div>
        <button className="btn primary block" style={{ marginTop: 20 }} onClick={start}>Start match</button>
      </div>
      <button className="btn block" onClick={sample}>See a sample report first</button>
    </>
  );
}
