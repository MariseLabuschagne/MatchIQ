import { useState } from "react";
import { useAuth } from "../../core/auth/AuthProvider";
import { createMatch, remember } from "../../core/matchFactory";
import { navigate } from "../../core/router";
import { Topbar } from "../../core/ui/components";
import { SquadPicker } from "../../core/ui/Squads";
import type { MySquad } from "../../core/squads";
import { SQUAD_WORDS } from "./words";
import type { HockeySetup } from "./model";

/** Stored as shown on the summary and PDF. Older matches may have a typed venue instead. */
const VENUES: [string, string][] = [["Home", "Home"], ["Away", "Away"], ["Neutral venue", "Neutral"]];

export function HockeySetupScreen() {
  const { user } = useAuth();
  const [f, setF] = useState<HockeySetup>({
    competition: remember("hockey.competition"),
    ourTeam: remember("hockey.team"),
    opponent: "",
    venue: "",
    format: (remember("hockey.format") as "2" | "4") || "4",
    periodMinutes: Number(remember("hockey.minutes")) || 15
  });
  const [squad, setSquad] = useState<MySquad | null>(null);
  const pickSquad = (s: MySquad | null) => { setSquad(s); if (s) set("ourTeam", s.name); };
  const [error, setError] = useState("");
  const set = <K extends keyof HockeySetup>(k: K, v: HockeySetup[K]) => setF((x) => ({ ...x, [k]: v }));

  const start = async () => {
    if (!f.ourTeam.trim()) return setError("Enter your team name.");
    if (!f.opponent.trim()) return setError("Enter the opposition name.");
    remember("hockey.team", f.ourTeam.trim());
    remember("hockey.competition", f.competition.trim());
    remember("hockey.format", f.format);
    remember("hockey.minutes", String(f.periodMinutes));
    const m = await createMatch("hockey", { ...f, ourTeam: f.ourTeam.trim(), opponent: f.opponent.trim() }, f.periodMinutes, user?.uid ?? null, squad?.id);
    navigate(`/match/${m.id}`);
  };

  return (
    <>
      <Topbar />
      <button className="link" onClick={() => navigate("/sport/hockey")}>← Hockey</button>
      <div className="card">
        <h2 style={{ marginBottom: 16 }}>New hockey match</h2>
        <label className="field">Competition<input id="h-comp" type="text" value={f.competition} onChange={(e) => set("competition", e.target.value)} placeholder="League, festival, friendly" /></label>
        <SquadPicker sport="hockey" words={SQUAD_WORDS} value={squad?.id ?? ""} onChange={pickSquad} />
        <label className="field">Our team<input id="h-team" type="text" value={f.ourTeam} onChange={(e) => set("ourTeam", e.target.value)} placeholder="e.g. U14A" /></label>
        <label className="field">Opposition<input id="h-opp" type="text" value={f.opponent} onChange={(e) => set("opponent", e.target.value)} /></label>
        <div className="field">Venue
          <div className="seg" role="group" aria-label="Venue">
            {VENUES.map(([v, label]) => <button key={v} type="button" aria-pressed={f.venue === v} onClick={() => set("venue", f.venue === v ? "" : v)}>{label}</button>)}
          </div>
        </div>
        <div className="field">
          Format
          <div className="seg">
            <button aria-pressed={f.format === "4"} onClick={() => set("format", "4")}>4 quarters</button>
            <button aria-pressed={f.format === "2"} onClick={() => set("format", "2")}>2 halves</button>
          </div>
        </div>
        <label className="field">
          Period length (minutes)
          <select id="h-minutes" value={f.periodMinutes} onChange={(e) => set("periodMinutes", Number(e.target.value))}>
            {[10, 12, 15, 16, 17, 20, 25, 30, 35].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {error && <p className="message" style={{ marginTop: 16 }}>{error}</p>}
        <button className="btn primary block" style={{ marginTop: 20 }} onClick={start}>Start match</button>
      </div>
    </>
  );
}
