import { useEffect, useState } from "react";
import { useAuth } from "./core/auth/AuthProvider";
import { AuthScreen, VerifyScreen } from "./core/auth/AuthScreen";
import { navigate, useRoute } from "./core/router";
import { listLocal, type StoredMatch } from "./core/storage/local";
import { pullAll, removeMatch } from "./core/storage/sync";
import { Confirm, Topbar } from "./core/ui/components";
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
    if (user?.emailVerified) pullAll(user.uid).catch((err) => console.warn("Could not fetch cloud matches yet", err));
  }, [user]);

  if (!ready) return <main className="app"><p className="muted center" style={{ marginTop: 80 }}>Loading…</p></main>;
  if (!user) return <main className="app"><AuthScreen /></main>;
  if (!user.emailVerified) return <main className="app"><VerifyScreen /></main>;
  return <main className="app"><Routes /></main>;
}

function Routes() {
  const [a, b, c] = useRoute();
  const sport = getSport(b);
  if (a === "sport" && sport) return <SportMenu sport={sport} />;
  if (a === "new" && sport) return <sport.Setup />;
  if (a === "history" && sport) return <History sport={sport} />;
  if (a === "match" && b) return <MatchScreen key={b} id={b} view={c} />;
  return <Home />;
}

function Home() {
  const { profile, logout } = useAuth();
  return (
    <>
      <Topbar />
      <div className="home">
        <img className="home-logo" src="./matchiq-logo.jpeg" alt="MatchIQ" />
        <p className="home-tagline">Tap what happens. See what matters.</p>
        {SPORTS.map((s) => (
          <button key={s.id} className={`sport-button ${s.buttonClass}`} onClick={() => navigate(`/sport/${s.id}`)}>{s.icon} {s.name}</button>
        ))}
        {COMING_SOON.map((s) => (
          <button key={s.name} className="sport-button disabled" disabled>
            <span>{s.icon} {s.name}<small>{s.note}</small></span>
          </button>
        ))}
        <p className="muted small">Signed in{profile?.name ? ` as ${profile.name}` : ""}. <button className="link" onClick={logout}>Sign out</button></p>
      </div>
    </>
  );
}

function SportMenu({ sport }: { sport: SportModule }) {
  const { user } = useAuth();
  const [active, setActive] = useState<StoredMatch[]>([]);
  useEffect(() => {
    listLocal(user?.uid ?? null, sport.id).then((list) => setActive(list.filter((m) => m.status === "active")));
  }, [sport, user]);
  return (
    <>
      <Topbar />
      <div className="home">
        <h2>{sport.name}</h2>
        {active.map((m) => (
          <button key={m.id} className="btn primary block" onClick={() => navigate(`/match/${m.id}`)}>
            Resume: {sport.title(m.setup)}
          </button>
        ))}
        <button className={`sport-button ${sport.buttonClass}`} onClick={() => navigate(`/new/${sport.id}`)}>New match</button>
        <button className="sport-button history" onClick={() => navigate(`/history/${sport.id}`)}>Match history</button>
        <button className="link" onClick={() => navigate("/")}>← All sports</button>
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
  const load = () => listLocal(uid, sport.id).then(setList);
  useEffect(() => { load(); }, [sport, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Topbar />
      <button className="link" onClick={() => navigate(`/sport/${sport.id}`)}>← {sport.name}</button>
      <h2>{sport.name} history</h2>
      {list === null && <p className="muted">Loading…</p>}
      {list?.length === 0 && <p className="muted">No matches yet.</p>}
      <div className="stack" style={{ gap: 10 }}>
        {list?.map((m) => (
          <div key={m.id} className="card history-item">
            <button style={{ textAlign: "left", flex: 1, minWidth: 0 }} onClick={() => navigate(`/match/${m.id}${m.status === "completed" ? `/${sport.completedView}` : ""}`)}>
              <div style={{ fontWeight: 700 }}>{sport.title(m.setup)}</div>
              <div className="meta">{fmtDate(m.createdAt)} · {sport.scoreLine(m)}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {m.status === "active" && <span className="badge">In progress</span>}
                {m.importedFrom && <span className="badge">Imported</span>}
              </div>
            </button>
            <button className="btn small danger" onClick={() => setDel(m)} aria-label={`Delete ${sport.title(m.setup)}`}>Delete</button>
          </div>
        ))}
      </div>
      {sport.HistoryExtra && <sport.HistoryExtra onChanged={load} />}
      {del && <Confirm title="Delete this match?" body={`${sport.title(del.setup)} on ${fmtDate(del.createdAt)} is removed from this phone and the cloud. This cannot be undone.`} confirmLabel="Delete match" danger onConfirm={async () => { await removeMatch(del.id, uid); load(); }} onClose={() => setDel(null)} />}
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
