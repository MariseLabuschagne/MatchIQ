import { useState } from "react";
import { useAuth } from "../../core/auth/AuthProvider";
import { createMatch, remember } from "../../core/matchFactory";
import { navigate } from "../../core/router";
import { Topbar } from "../../core/ui/components";
import { SquadPicker } from "../../core/ui/Squads";
import type { MySquad } from "../../core/squads";
import { SQUAD_WORDS } from "./words";
import { appendEvents } from "../../core/events";
import { saveMatch } from "../../core/storage/sync";
import type { Match } from "../../core/types";
import { FORMATS, LEVELS, type FormatKey, type Level, type TennisSetup } from "./model";
import { simulateMatch } from "./simulate";

export function TennisSetupScreen() {
  const { user } = useAuth();
  const [f, setF] = useState<TennisSetup>({
    player: remember("tennis.player"), opponent: "", competition: "",
    format: (remember("tennis.format") as FormatKey) || "bo3mtb", noAd: remember("tennis.noAd") !== "0",
    firstServer: "p", level: (remember("tennis.level") as Level) || "standard", endReason: null
  });
  const [squad, setSquad] = useState<MySquad | null>(null);
  const set = <K extends keyof TennisSetup>(k: K, v: TennisSetup[K]) => setF((x) => ({ ...x, [k]: v }));

  const pickSquad = (s: MySquad | null) => { setSquad(s); if (s) set("player", s.name); };

  const start = async () => {
    const setup = { ...f, player: f.player.trim() || "Player", opponent: f.opponent.trim() || "Opponent", competition: f.competition.trim() };
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
      <Topbar />
      <button className="link" onClick={() => navigate("/sport/tennis")}>← Tennis</button>
      <div className="card">
        <h2>Capture a match, one point at a time</h2>
        <p className="muted" style={{ margin: "6px 0 16px" }}>After each point, tap who won and, if you can, how. MatchIQ keeps the score.</p>
        <SquadPicker sport="tennis" words={SQUAD_WORDS} value={squad?.id ?? ""} onChange={pickSquad} />
        <label className="field">Your player<input id="t-player" type="text" value={f.player} onChange={(e) => set("player", e.target.value)} placeholder="e.g. Mia" /></label>
        <label className="field">Opponent<input id="t-opp" type="text" value={f.opponent} onChange={(e) => set("opponent", e.target.value)} placeholder="Name and school" /></label>
        <label className="field">Competition (optional)<input id="t-comp" type="text" value={f.competition} onChange={(e) => set("competition", e.target.value)} placeholder="League, inter-schools, practice" /></label>
        <label className="field">Format
          <select id="t-format" value={f.format} onChange={(e) => set("format", e.target.value as FormatKey)}>
            {(Object.keys(FORMATS) as FormatKey[]).map((k) => <option key={k} value={k}>{FORMATS[k].label}</option>)}
          </select>
        </label>
        <label className="check">No-ad scoring (deciding point at deuce)<input id="t-noad" type="checkbox" checked={f.noAd} onChange={(e) => set("noAd", e.target.checked)} /></label>
        <div className="field">Serves first
          <div className="seg">
            <button aria-pressed={f.firstServer === "p"} onClick={() => set("firstServer", "p")}>Your player</button>
            <button aria-pressed={f.firstServer === "o"} onClick={() => set("firstServer", "o")}>Opponent</button>
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
