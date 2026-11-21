import { useEffect, useState } from "react";
import { useAuth } from "./core/auth/AuthProvider";
import { AuthScreen, VerifyScreen } from "./core/auth/AuthScreen";
import { navigate, useRoute } from "./core/router";
import { listLocal, onLocalChange, type StoredMatch } from "./core/storage/local";
import { pullAll, removeMatch } from "./core/storage/sync";
import { BuiltBy, Confirm, MovedNotice, Topbar } from "./core/ui/components";
import { SquadScreen, SquadSection, useAppAdmin, useMySquads } from "./core/ui/Squads";
import { useMatch } from "./core/useMatch";
import { COMING_SOON, SPORTS, getSport } from "./sports/registry";
import type { SportModule } from "./sports/types";

/**
 * App shell: sign-in gate, home, sport menu, history and routing.
 * It knows no sport by name; everything sport-specific comes from src/sports/registry.ts.
 */
export default function App() {
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!user?.emailVerified) return;
    const uid = user.uid;
    pullAll(uid).catch((err) => console.warn("Could not fetch cloud matches yet", err));
    for (const s of SPORTS) s.onSignIn?.(uid).catch((err) => console.warn(`${s.name}: sign-in task will retry next time`, err));
  }, [user]);

  if (!ready) return <main className="app"><p className="muted center" style={{ marginTop: 80 }}>Loading…</p></main>;
  if (!user) return <main className="app"><MovedNotice /><AuthScreen /></main>;
  if (!user.emailVerified) return <main className="app"><VerifyScreen /></main>;
  return <main className="app"><MovedNotice /><Routes /></main>;
}

function Routes() {
  const [a, b, c] = useRoute();
  const sport = getSport(b);
  if (a === "sport" && sport) return <SportMenu sport={sport} />;
  if (a === "new" && sport) return <sport.Setup />;
  if (a === "history" && sport) return <History sport={sport} />;
  if (a === "match" && b) return <MatchScreen key={b} id={b} view={c} />;
  if (a === "squad" && b) return <SquadScreen key={b} id={b} words={(id) => getSport(id)?.squad} sportName={(id) => getSport(id)?.name ?? id} />;
  return <Home />;
}

function Home() {
  const { profile, logout } = useAuth();
  return (
    <>
      <Topbar />
      <div className="home">
        <img className="home-logo" src="./matchiq-logo.jpeg" alt="MatchIQ" />
        <p className="section-label">Choose a sport</p>
        <div className="sport-list">
          {SPORTS.map((s) => (
            <button key={s.id} className="sport-row" onClick={() => navigate(`/sport/${s.id}`)}>
              <span className="sport-icon"><s.Icon /></span>
              <span><span className="name">{s.name}</span><span className="sub">{s.blurb}</span></span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
          ))}
          {COMING_SOON.map((s) => {
            const body = (
              <>
                <span className="sport-icon"><s.Icon /></span>
                <span><span className="name">{s.name}</span><span className="sub">{s.note}</span></span>
                <span className="chev" aria-hidden="true">{s.href ? "›" : ""}</span>
              </>
            );
            return s.href
              ? <a key={s.name} className="sport-row muted-row" href={s.href}>{body}</a>
              : <div key={s.name} className="sport-row muted-row" aria-disabled="true">{body}</div>;
          })}
        </div>
        <div className="home-foot">
          <p className="muted small">Signed in{profile?.name ? ` as ${profile.name}` : ""}. <button className="link" onClick={logout}>Sign out</button></p>
          <BuiltBy />
        </div>
      </div>
    </>
  );
}

function SportMenu({ sport }: { sport: SportModule }) {
  const { user } = useAuth();
  const [active, setActive] = useState<StoredMatch[]>([]);
  useEffect(() => {
    const load = () => listLocal(user?.uid ?? null, sport.id).then((list) => setActive(list.filter((m) => m.status === "active")));
    load();
    return onLocalChange(load);
  }, [sport, user]);
  return (
    <>
      <Topbar />
      <div className="home">
        <button className="link" style={{ alignSelf: "flex-start" }} onClick={() => navigate("/")}>← All sports</button>
        <div className="menu-head">
          <span className="sport-icon"><sport.Icon /></span>
          <h2>{sport.name}</h2>
        </div>
        {active.map((m) => (
          <button key={m.id} className="sport-row" onClick={() => navigate(`/match/${m.id}`)}>
            <span className="sport-icon" aria-hidden="true">▶</span>
            <span><span className="name">Resume: {sport.title(m.setup)}</span><span className="sub">In progress · {sport.scoreLine(m)}</span></span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
        ))}
        <button className="btn primary block" onClick={() => navigate(`/new/${sport.id}`)}>New match</button>
        <button className="btn block" onClick={() => navigate(`/history/${sport.id}`)}>Match history</button>
        <SquadSection sport={sport.id} words={sport.squad} />
      </div>
    </>
  );
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function History({ sport }: { sport: SportModule }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [list, setList] = useState<StoredMatch[] | null>(null);
  const [del, setDel] = useState<StoredMatch | null>(null);
  const [squads] = useMySquads(sport.id);
  const appAdmin = useAppAdmin();
  const load = () => listLocal(uid, sport.id).then(setList);
  useEffect(() => {
    load();
    // Fetch matches others in your teams have captured since you opened the app.
    if (uid) pullAll(uid).catch(() => {});
    return onLocalChange(load);
  }, [sport, uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const squadOf = (m: StoredMatch) => squads?.find((s) => s.id === m.squadId);

  // Season filters: which team or player, and which year. Remembered per sport on this phone.
  const keyOf = (m: StoredMatch) => sport.seasonKey(m.setup) || "Unnamed";
  const keys = [...new Set((list ?? []).map(keyOf))].sort();
  const years = [...new Set((list ?? []).map((m) => m.createdAt.slice(0, 4)))].sort().reverse();
  const [who, setWho] = useState<string>(() => { try { return localStorage.getItem(`matchiq.${sport.id}.season.who`) ?? ""; } catch { return ""; } });
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const pickWho = (v: string) => { setWho(v); try { localStorage.setItem(`matchiq.${sport.id}.season.who`, v); } catch { /* private mode */ } };
  const activeWho = keys.includes(who) ? who : keys.length === 1 ? keys[0] : "";
  const shown = (list ?? []).filter((m) => (!activeWho || keyOf(m) === activeWho) && (year === "all" || m.createdAt.startsWith(year)));
  const seasonMatches = shown.filter((m) => m.status === "completed").slice().reverse();
  // Your own matches, ones you captured, and any match in a team you coach can be deleted.
  // Your own matches; in a shared team or player, coaches and administrators can delete any match.
  const canDelete = (m: StoredMatch) => !m.squadId || m.createdBy === uid || appAdmin || squadOf(m)?.role === "coach" || !!squadOf(m)?.admin;

  return (
    <>
      <Topbar />
      <button className="link" onClick={() => navigate(`/sport/${sport.id}`)}>← {sport.name}</button>
      <h2>{sport.name} history</h2>
      {list === null && <p className="muted">Loading…</p>}
      {list?.length === 0 && <p className="muted">No matches yet.</p>}
      {!!list?.length && (
        <div className="filters">
          <select aria-label={`${sport.squad.one} to show`} value={activeWho} onChange={(e) => pickWho(e.target.value)}>
            {keys.length > 1 && <option value="">All {sport.squad.many}</option>}
            {keys.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            {!years.includes(year) && year !== "all" && <option value={year}>{year}</option>}
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
            <option value="all">All time</option>
          </select>
        </div>
      )}
      {!!list?.length && (
        <section className="card stack season">
          <h3 style={{ margin: 0 }}>{activeWho ? `${activeWho} · ` : ""}{year === "all" ? "All time" : `${year} season`}</h3>
          {!activeWho ? <p className="muted small">Choose a {sport.squad.one} to see their season.</p>
            : seasonMatches.length === 0 ? <p className="muted small">No finished matches in this period yet.</p>
            : <sport.Season matches={seasonMatches} />}
        </section>
      )}
      {!!list?.length && shown.length === 0 && <p className="muted">No matches in this period.</p>}
      <div className="stack" style={{ gap: 10 }}>
        {shown.map((m) => (
          <div key={m.id} className="card history-item">
            <button style={{ textAlign: "left", flex: 1, minWidth: 0 }} onClick={() => navigate(`/match/${m.id}${m.status === "completed" ? `/${sport.completedView}` : ""}`)}>
              <div style={{ fontWeight: 700 }}>{sport.title(m.setup)}</div>
              <div className="meta">{fmtDate(m.createdAt)} · {sport.scoreLine(m)}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {m.status === "active" && <span className="badge">In progress</span>}
                {m.importedFrom && <span className="badge">Imported</span>}
                {m.squadId && <span className="badge">{squadOf(m)?.name ?? "Shared"}</span>}
              </div>
            </button>
            {canDelete(m) && <button className="btn small danger" onClick={() => setDel(m)} aria-label={`Delete ${sport.title(m.setup)}`}>Delete</button>}
          </div>
        ))}
      </div>
      {sport.HistoryExtra && <sport.HistoryExtra onChanged={load} />}
      {del && <Confirm title="Delete this match?" body={`${sport.title(del.setup)} on ${fmtDate(del.createdAt)} is removed from this phone and the cloud${del.squadId ? ", for everyone in the " + sport.squad.one : ""}. This cannot be undone.`} confirmLabel="Delete match" danger onConfirm={async () => { await removeMatch(del.id, uid); load(); }} onClose={() => setDel(null)} />}
    </>
  );
}

function MatchScreen({ id, view }: { id: string; view?: string }) {
  const { user } = useAuth();
  const session = useMatch<unknown>(id, user?.uid ?? null);
  const m = session.match;
  if (session.missing) return <><Topbar /><p className="muted">This match is not on this phone.</p><button className="link" onClick={() => navigate("/")}>Home</button></>;
  if (!m) return <><Topbar /><p className="muted center">Loading…</p></>;
  const sport = getSport(m.sport);
  if (!sport) return <><Topbar /><p className="muted">This app version cannot open {m.sport} matches yet.</p><button className="link" onClick={() => navigate("/")}>Home</button></>;
  return <sport.MatchView session={session} view={view} />;
}
